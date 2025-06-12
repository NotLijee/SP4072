from bs4 import BeautifulSoup
from yahooquery import Ticker
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
from dateutil.relativedelta import relativedelta

import matplotlib.pyplot as plt
import requests 
import pandas as pd 
import google.generativeai as genai
import yfinance as yf
import time
from yfinance.exceptions import YFRateLimitError

# import schedule
# import time 

alpha_venture_key = 'JJDNGEC518DHS91O'
gemini_key  = 'AIzaSyDMnwxHeY56qzEaPArhPUKuGAIY2oijGsc'
genai.configure(api_key=gemini_key)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

url = 'http://openinsider.com/insider-purchases-25k'
page = requests.get(url)
soup = BeautifulSoup(page.text, 'html')
latest_insider_purchase_table = soup.find_all('table')[11]
headers = latest_insider_purchase_table.find_all('th')

# Getting data and cleaning it up
header_titles = [title.text.strip().replace('\xa0', ' ') for title in headers]
dataframe = pd.DataFrame(columns=header_titles)
column_data = latest_insider_purchase_table.find_all('tr')

dataframe.rename(columns={
    'X': 'x',
    'Filing Date': 'filingDate',
    'Trade Date': 'tradeDate',
    'Ticker': 'ticker',
    'Company Name': 'companyName',
    'Insider Name': 'insiderName',
    'Title': 'title',
    'Trade Type': 'tradeType',
    'Price': 'price',
    'Qty': 'quantity',
    'Owned': 'alreadyOwned',
    'ΔOwn': 'percentOwnedIncrease',
    'Value': 'moneyValueIncrease'
}, inplace=True)

# Creating the dataframe
for row in column_data[1:]:
    row_data = row.find_all('td')
    each_row_data = [individual_data.text.strip() for individual_data in row_data]
    length = len(dataframe)
    dataframe.loc[length] = each_row_data

# Turning the percentage into integers and putting them back in DF to compare
dataframe.iloc[:, 11] = dataframe.iloc[:, 11].replace('%', '', regex=True)
dataframe.iloc[:, 11] = pd.to_numeric(dataframe.iloc[:, 11], errors='coerce')
dataframe.iloc[:, 11] = dataframe.iloc[:, 11].fillna(0).astype(float)
dataframe.iloc[:, 11] = dataframe.iloc[:, 11].astype(int)
#Changing the date format to look normal 
dataframe["tradeDate"] = pd.to_datetime(dataframe["tradeDate"]).dt.strftime("%-m/%-d/%y")
dataframe["filingDate"] = pd.to_datetime(dataframe["filingDate"]).dt.strftime("%-m/%-d/%y")




# Getting filtered dataframes for API 
def all_data():
    return dataframe

def ceo():
    filtered_dataframe_ceo = dataframe[(dataframe.iloc[:, 11] > 0) & (dataframe['title'] == 'CEO')]
    return filtered_dataframe_ceo

def pres():
    filtered_dataframe_pres = dataframe[(dataframe.iloc[:, 11] > 0) & (dataframe['title'] == 'Pres, CEO')]
    return filtered_dataframe_pres

def cfo():
    filtered_dataframe_cfo = dataframe[(dataframe.iloc[:, 11] > 0) & (dataframe['title'] == 'CFO')]
    return filtered_dataframe_cfo

def director():
    # Filter for directors - look for 'Dir' in the title field
    filtered_dataframe_dir = dataframe[(dataframe.iloc[:, 11] > 0) & 
                                      (dataframe['title'].str.contains('Dir', case=False, na=False))]
    return filtered_dataframe_dir

def ten_percent_owner():
    # Filter for 10% owners - look for '10%' or similar terms in the title field
    filtered_dataframe_ten = dataframe[(dataframe.iloc[:, 11] > 0) &  (dataframe['title'].str.contains('10%|10-Percent|10 Percent',  case=False, regex=True, na=False))]
    return filtered_dataframe_ten

def ticker_ytd(ticker: str):
    try:
        # Clean the ticker symbol
        ticker = ticker.strip().upper()
        
        # Calculate date range
        today = date.today()
        start_date = date(today.year, 1, 1)
        
        # Create Ticker object
        ticker_obj = yf.Ticker(ticker)
        
        # Try to get weekly data first
        try:
            data = ticker_obj.history(
                interval="1wk",
                start=start_date,
                end=today
            )
            
            if not data.empty:
                chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
                return chart_data
        except Exception:
            pass
        
        # If weekly data fails, try daily data
        try:
            data = ticker_obj.history(
                interval="1d",
                start=start_date,
                end=today
            )
            
            if not data.empty:
                chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
                return chart_data
        except Exception:
            pass
        
        # If both attempts fail, try one last time with download
        try:
            data = yf.download(
                ticker,
                start=start_date,
                end=today,
                interval="1d",
                progress=False
            )
            
            if not data.empty:
                chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
                return chart_data
        except Exception:
            pass
        
        # If all attempts fail, return empty array
        return []
        
    except Exception:
        return []

def ticker_one_year(ticker: str):
    try:
        today = date.today()
        one_year_ago = today - relativedelta(years=1)
        ticker = yf.Ticker(ticker)
        data = ticker.history(interval="1wk", start=one_year_ago, end=today)
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for ticker {ticker}"
            )
        chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
        return chart_data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data: {str(e)}"
        )

def ticker_three_month(ticker: str):
    try:
        today = date.today()
        three_month_ago = today - relativedelta(months=3)
        ticker = yf.Ticker(ticker)
        data = ticker.history(interval="1d", start=three_month_ago, end=today)
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for ticker {ticker}"
            )
        chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
        return chart_data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data: {str(e)}"
        )

def ticker_one_month(ticker: str):
    try:
        today = date.today()
        one_month_ago = today - relativedelta(months=1)
        ticker = yf.Ticker(ticker)
        data = ticker.history(interval="1d", start=one_month_ago, end=today)
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for ticker {ticker}"
            )
        chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
        return chart_data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data: {str(e)}"
        )

def ticker_one_week(ticker: str):
    try:
        today = date.today()
        one_week_ago = today - relativedelta(weeks=1)
        ticker = yf.Ticker(ticker)
        data = ticker.history(interval="1d", start=one_week_ago, end=today)
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for ticker {ticker}"
            )
        chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
        return chart_data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data: {str(e)}"
        )

def ticker_one_day(ticker: str):
    try:
        today = date.today()
        ticker = yf.Ticker(ticker)
        data = ticker.history(interval="1d", start=today, end=today)
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for ticker {ticker}"
            )
        chart_data = data.reset_index()[['Date', 'Close']].to_dict(orient='records')
        return chart_data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data: {str(e)}"
        )

#Model for API
class TradeData(BaseModel):
    x: str
    filingDate: str
    tradeDate: str
    ticker: str
    companyName: str
    insiderName: str
    title: str
    tradeType: str
    price: float
    quantity: int
    alreadyOwned: int
    percentOwnedIncrease: float
    moneyValueIncrease: float


def ai_analysis(ticker: str):
    try:
        # Use comprehensive but safe yfinance data gathering
        stock = yf.Ticker(ticker)
        analysis_data = {}
        
        # 1. Get extended historical data (most reliable)
        try:
            # Get 3 months of daily data for better trend analysis
            hist_3m = stock.history(period="3mo", interval="1d")
            if not hist_3m.empty:
                current_price = round(hist_3m['Close'].iloc[-1], 2)
                prev_price = round(hist_3m['Close'].iloc[-2], 2) if len(hist_3m) > 1 else current_price
                price_change = round(current_price - prev_price, 2)
                percent_change = round((price_change / prev_price) * 100, 2) if prev_price != 0 else 0
                
                # Calculate additional metrics
                high_52w = round(hist_3m['High'].max(), 2)
                low_52w = round(hist_3m['Low'].min(), 2)
                avg_volume = int(hist_3m['Volume'].mean())
                recent_volume = int(hist_3m['Volume'].iloc[-1])
                
                # Calculate volatility (standard deviation of returns)
                returns = hist_3m['Close'].pct_change().dropna()
                volatility = round(returns.std() * 100, 2)
                
                analysis_data.update({
                    'current_price': current_price,
                    'price_change': price_change,
                    'percent_change': percent_change,
                    'high_3m': high_52w,
                    'low_3m': low_52w,
                    'avg_volume': avg_volume,
                    'recent_volume': recent_volume,
                    'volatility': volatility,
                    'trend_days': len(hist_3m)
                })
            else:
                analysis_data.update({
                    'current_price': 'N/A', 'price_change': 0, 'percent_change': 0,
                    'high_3m': 'N/A', 'low_3m': 'N/A', 'avg_volume': 'N/A', 
                    'recent_volume': 'N/A', 'volatility': 'N/A', 'trend_days': 0
                })
        except Exception as e:
            print(f"Historical data error for {ticker}: {e}")
            analysis_data.update({
                'current_price': 'N/A', 'price_change': 0, 'percent_change': 0,
                'high_3m': 'N/A', 'low_3m': 'N/A', 'avg_volume': 'N/A', 
                'recent_volume': 'N/A', 'volatility': 'N/A', 'trend_days': 0
            })
        
        # Small delay to avoid rate limiting
        time.sleep(0.1)
        
        # 2. Try to get basic company information (sometimes works)
        try:
            info = stock.info
            analysis_data.update({
                'company_name': info.get('longName', ticker),
                'sector': info.get('sector', 'Unknown'),
                'market_cap': info.get('marketCap', 'N/A'),
                'pe_ratio': info.get('trailingPE', 'N/A'),
                'dividend_yield': info.get('dividendYield', 'N/A'),
                'beta': info.get('beta', 'N/A')
            })
        except Exception as e:
            print(f"Basic info error for {ticker}: {e}")
            analysis_data.update({
                'company_name': ticker,
                'sector': 'Unknown',
                'market_cap': 'N/A',
                'pe_ratio': 'N/A',
                'dividend_yield': 'N/A',
                'beta': 'N/A'
            })
        
        # Small delay to avoid rate limiting
        time.sleep(0.1)
        
        # 3. Try to get recent news (often blocked, but worth trying)
        try:
            news = stock.news
            recent_news = []
            if news and len(news) > 0:
                for item in news[:3]:  # Get up to 3 recent news items
                    recent_news.append({
                        'title': item.get('title', '')[:100],  # Limit title length
                        'summary': item.get('summary', '')[:200] if item.get('summary') else ''
                    })
            analysis_data['recent_news'] = recent_news
        except Exception as e:
            print(f"News error for {ticker}: {e}")
            analysis_data['recent_news'] = []
        
        # Small delay to avoid rate limiting
        time.sleep(0.1)
        
        # 4. Try to get analyst recommendations (often blocked)
        try:
            recommendations = stock.recommendations
            if recommendations is not None and not recommendations.empty:
                latest_rec = recommendations.iloc[-1] if len(recommendations) > 0 else None
                if latest_rec is not None:
                    analysis_data['analyst_recommendation'] = {
                        'strong_buy': int(latest_rec.get('strongBuy', 0)),
                        'buy': int(latest_rec.get('buy', 0)),
                        'hold': int(latest_rec.get('hold', 0)),
                        'sell': int(latest_rec.get('sell', 0)),
                        'strong_sell': int(latest_rec.get('strongSell', 0))
                    }
                else:
                    analysis_data['analyst_recommendation'] = None
            else:
                analysis_data['analyst_recommendation'] = None
        except Exception as e:
            print(f"Recommendations error for {ticker}: {e}")
            analysis_data['analyst_recommendation'] = None
        
        # Create a comprehensive prompt with all available data
        prompt = f"""You are a professional financial advisor analyzing {ticker} stock. 
        
Comprehensive Stock Analysis Data:
- Company: {analysis_data.get('company_name', ticker)}
- Sector: {analysis_data.get('sector', 'Unknown')}
- Current Price: ${analysis_data.get('current_price', 'N/A')}
- Price Change: ${analysis_data.get('price_change', 0)} ({analysis_data.get('percent_change', 0)}%)
- 3-Month High: ${analysis_data.get('high_3m', 'N/A')}
- 3-Month Low: ${analysis_data.get('low_3m', 'N/A')}
- Average Volume: {analysis_data.get('avg_volume', 'N/A'):,} shares
- Recent Volume: {analysis_data.get('recent_volume', 'N/A'):,} shares
- Volatility: {analysis_data.get('volatility', 'N/A')}%
- P/E Ratio: {analysis_data.get('pe_ratio', 'N/A')}
- Beta: {analysis_data.get('beta', 'N/A')}
- Market Cap: {analysis_data.get('market_cap', 'N/A')}
- Dividend Yield: {analysis_data.get('dividend_yield', 'N/A')}
- Data Points: {analysis_data.get('trend_days', 0)} days of trading data

Recent News Headlines:
{chr(10).join([f"- {news.get('title', '')}" for news in analysis_data.get('recent_news', [])[:2]]) if analysis_data.get('recent_news') else "- No recent news available"}

Analyst Recommendations:
{f"Strong Buy: {analysis_data['analyst_recommendation']['strong_buy']}, Buy: {analysis_data['analyst_recommendation']['buy']}, Hold: {analysis_data['analyst_recommendation']['hold']}, Sell: {analysis_data['analyst_recommendation']['sell']}, Strong Sell: {analysis_data['analyst_recommendation']['strong_sell']}" if analysis_data.get('analyst_recommendation') else "- No analyst recommendations available"}

Please provide a comprehensive analysis with:
1. A detailed summary of the stock's current position, recent performance, and key metrics (3-4 sentences)
2. A well-informed prediction for the next 2-4 weeks based on technical indicators, fundamentals, and market context (3-4 sentences)

Consider volume trends, volatility, price position relative to highs/lows, sector context, and any news sentiment.

Format your response as:
[SUMMARY]
Your detailed summary here

[PREDICTION]
Your informed prediction here

Make the analysis professional yet accessible, and base conclusions on the actual data provided."""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Split the response into summary and prediction
        response_text = response.text
        summary = ""
        prediction = ""
        
        if "[SUMMARY]" in response_text and "[PREDICTION]" in response_text:
            parts = response_text.split("[PREDICTION]")
            summary = parts[0].replace("[SUMMARY]", "").strip()
            prediction = parts[1].strip()
        else:
            # Fallback if format is not followed
            summary = response_text[:len(response_text)//2].strip()
            prediction = response_text[len(response_text)//2:].strip()
            
        return {
            "summary": summary,
            "prediction": prediction,
            "data_quality": f"Analysis based on {analysis_data.get('trend_days', 0)} days of data"
        }
        
    except Exception as e:
        print(f"Error in AI analysis for {ticker}: {e}")
        return {
            "error": f"Failed to generate analysis for {ticker}. Error: {str(e)}",
            "summary": "Unable to generate analysis at this time.",
            "prediction": "Please try again later."
        }


@app.get("/")
def home():
    return {"message": "Welcome to the Tradie FastAPI"}

@app.get("/allData")
def get_scrape_data():
    """Endpoint to trigger all data scraping and return the dataframe"""
    return all_data().to_dict(orient='records')

@app.get("/ceo")
def get_ceo_data():
    """Endpoint to trigger ceo data scraping"""
    return ceo().to_dict(orient='records')

@app.get("/pres")
def get_pres_data():
    """Endpoint to trigger pres data scraping"""
    return pres().to_dict(orient='records')

@app.get("/cfo")
def get_cfo_data():
    """Endpoint to trigger cfo data scraping"""
    return cfo().to_dict(orient='records')

@app.get("/dir")
def get_director_data():
    """Endpoint to trigger director data scraping"""
    return director().to_dict(orient='records')

@app.get("/ten-percent")
def get_ten_percent_data():
    """Endpoint to trigger 10% owner data scraping"""
    return ten_percent_owner().to_dict(orient='records')

@app.get("/ticker-ytd/{ticker}")
def get_ticker_json(ticker: str):
    """Endpoint to trigger ticker json scraping"""
    try:
        result = ticker_ytd(ticker)
        if result is None:
            return []
        return result
    except Exception:
        return []

@app.get("/ticker-one-year/{ticker}")
def get_ticker_one_year_json(ticker: str):
    """Endpoint to trigger ticker one year json scraping"""
    return ticker_one_year(ticker)

@app.get("/ticker-three-month/{ticker}")
def get_ticker_three_month_json(ticker: str):
    """Endpoint to trigger ticker three month json scraping"""
    return ticker_three_month(ticker)

@app.get("/ticker-one-month/{ticker}")
def get_ticker_one_month_json(ticker: str):
    """Endpoint to trigger ticker one month json scraping"""
    return ticker_one_month(ticker)

@app.get("/ticker-one-week/{ticker}")
def get_ticker_one_week_json(ticker: str):
    """Endpoint to trigger ticker one week json scraping"""
    return ticker_one_week(ticker)

@app.get("/ticker-one-day/{ticker}")
def get_ticker_one_day_json(ticker: str):
    """Endpoint to trigger ticker one day json scraping"""
    return ticker_one_day(ticker)

@app.get("/analysis/{ticker}")
async def get_ai_analysis(ticker: str):
    """Endpoint to get AI analysis for a given ticker."""
    try:
        result = ai_analysis(ticker)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))