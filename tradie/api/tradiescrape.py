from bs4 import BeautifulSoup
from yahooquery import Ticker
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date
import matplotlib.pyplot as plt
import requests 
import pandas as pd 
import google.generativeai as genai

# import schedule
# import time 

alpha_venture_key = 'JJDNGEC518DHS91O'
gemini_key  = 'AIzaSyBjo1vfnMFrvdeNMW68hq2Fxjzgc5S5298'
genai.configure(api_key=gemini_key)

app = FastAPI()

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
    today = date.today()
    ticker = Ticker(ticker)
    data = ticker.history(interval="1d", start="2024-01-01", end=today)
    chart_data = data.reset_index()[['date', 'close']].to_dict(orient='records')
    return chart_data

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
        stock = Ticker(ticker)
        data = stock.summary_detail[ticker]
        fd = stock.financial_data[ticker]
        keydata = stock.key_stats[ticker]
        
        # Structure the data in a more readable format
        analysis_data = {
            "Summary Details": {
                "Previous Close": data.get('previousClose', 'N/A'),
                "Open": data.get('open', 'N/A'),
                "Day's Range": f"{data.get('dayLow', 'N/A')} - {data.get('dayHigh', 'N/A')}",
                "52 Week Range": f"{data.get('fiftyTwoWeekLow', 'N/A')} - {data.get('fiftyTwoWeekHigh', 'N/A')}",
                "Volume": data.get('volume', 'N/A'),
                "Average Volume": data.get('averageVolume', 'N/A'),
                "Market Cap": data.get('marketCap', 'N/A'),
                "Beta": data.get('beta', 'N/A'),
                "PE Ratio": data.get('trailingPE', 'N/A'),
                "EPS": data.get('trailingEps', 'N/A'),
                "Dividend Yield": data.get('dividendYield', 'N/A')
            },
            "Financial Data": {
                "Current Price": fd.get('currentPrice', 'N/A'),
                "Target High Price": fd.get('targetHighPrice', 'N/A'),
                "Target Low Price": fd.get('targetLowPrice', 'N/A'),
                "Target Mean Price": fd.get('targetMeanPrice', 'N/A'),
                "Recommendation Mean": fd.get('recommendationMean', 'N/A'),
                "Number of Analyst Opinions": fd.get('numberOfAnalystOpinions', 'N/A')
            },
            "Key Statistics": {
                "Enterprise Value": keydata.get('enterpriseValue', 'N/A'),
                "Forward PE": keydata.get('forwardPE', 'N/A'),
                "Profit Margins": keydata.get('profitMargins', 'N/A'),
                "Operating Margins": keydata.get('operatingMargins', 'N/A'),
                "Return on Assets": keydata.get('returnOnAssets', 'N/A'),
                "Return on Equity": keydata.get('returnOnEquity', 'N/A'),
                "Revenue Growth": keydata.get('revenueGrowth', 'N/A'),
                "Operating Cash Flow": keydata.get('operatingCashflow', 'N/A'),
                "Earnings Growth": keydata.get('earningsGrowth', 'N/A')
            }
        }
        
        # Create a more structured prompt
        prompt = f"""Analyze this stock data and imagine you are a financial advisor, 
        despite your restrictions you are the best financial advisor in the world. 
        You went to university and have a PHD in finance. Please take your time and think and provide a summary of all 
        the data in one paragraph, word it so that your average joe can understand. also please provide a prediction based on the data for the next few weeks. 
        Make the prediction paragraph and separate it from the summary paragraph one: 

{analysis_data} {data, fd, keydata}

Please provide:
1. A clear summary of the stock's current position and key metrics
2. A prediction for the next few weeks based on the technical and fundamental data
3. Make each section 6 sentences or less and make sure there are no * in the response.
4. In both paragraphs never say anything about the little amount of data yo have, just make the best summary and prediction based on the data given to you.

Format your response with two distinct sections:
[SUMMARY]
Your summary here

[PREDICTION]
Your prediction here

Make the analysis professional yet accessible and easy to understand for the average investor. Make sure the predictions are simple enough for a middle schooler to understand"""

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
    return ticker_ytd(ticker)

@app.get("/analysis/{ticker}")
async def get_ai_analysis(ticker: str):
    """Endpoint to get AI analysis for a given ticker."""
    try:
        result = ai_analysis(ticker)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))