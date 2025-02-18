from bs4 import BeautifulSoup
from yahooquery import Ticker
from fastapi import FastAPI
import yfinance as yf 
from pydantic import BaseModel
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






def all_data():
    return dataframe

def ceo():
    filtered_dataframe_ceo = dataframe[(dataframe.iloc[:, 11] > 1) & (dataframe['title'] == 'CEO')]
    return filtered_dataframe_ceo
def pres():
    filtered_dataframe_pres = dataframe[(dataframe.iloc[:, 11] > 1) & (dataframe['title'] == 'Pres, CEO')]
    return filtered_dataframe_pres
def cfo():
    filtered_dataframe_cfo = dataframe[(dataframe.iloc[:, 11] > 10) & (dataframe['title'] == 'CFO')]
    return filtered_dataframe_cfo


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


@app.get("/")
def home():
    return {"message": "Welcome to the FastAPI Insider Trading API"}

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