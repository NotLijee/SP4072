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
        # Use minimal yfinance data to avoid 401 errors
        stock = yf.Ticker(ticker)
        
        # Get basic historical data (less likely to be blocked)
        try:
            # Try to get recent price data instead of comprehensive info
            hist = stock.history(period="5d", interval="1d")
            if not hist.empty:
                current_price = round(hist['Close'].iloc[-1], 2)
                price_change = round(hist['Close'].iloc[-1] - hist['Close'].iloc[-2], 2) if len(hist) > 1 else 0
                percent_change = round((price_change / hist['Close'].iloc[-2]) * 100, 2) if len(hist) > 1 and hist['Close'].iloc[-2] != 0 else 0
            else:
                current_price = "N/A"
                price_change = 0
                percent_change = 0
        except Exception:
            current_price = "N/A"
            price_change = 0
            percent_change = 0
        
        # Create a simple prompt with basic data
        prompt = f"""You are a financial advisor. Analyze {ticker} stock briefly.
        
Current stock data:
- Ticker: {ticker}
- Recent price: ${current_price}
- Price change: ${price_change} ({percent_change}%)

Please provide:
1. A brief summary of the stock's recent performance (2-3 sentences)
2. A simple prediction for the next few weeks (2-3 sentences)

Format your response as:
[SUMMARY]
Your summary here

[PREDICTION]  
Your prediction here

Keep it simple and accessible for average investors."""

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
            "prediction": prediction
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