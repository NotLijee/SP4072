from bs4 import BeautifulSoup
from yahooquery import Ticker
from fastapi import FastAPI
import requests 
import pandas as pd 
import google.generativeai as genai
import schedule
import time 


gemini_key  = 'AIzaSyBjo1vfnMFrvdeNMW68hq2Fxjzgc5S5298'
genai.configure(api_key=gemini_key)

app = FastAPI()

def scrape():
    # Scraping from insider 
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

    filtered_dataframe_ceo = dataframe[(dataframe.iloc[:, 11] > 1) & (dataframe['Title'] == 'CEO')]
    filtered_dataframe_pres = dataframe[(dataframe.iloc[:, 11] > 1) & (dataframe['Title'] == 'Pres, CEO')]
    filtered_dataframe_cfo = dataframe[(dataframe.iloc[:, 11] > 10) & (dataframe['Title'] == 'CFO')]

    if not filtered_dataframe_pres.empty:
        stock = filtered_dataframe_pres.iloc[1, 3]
        ticker = Ticker(f'{stock}')
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(f"Turn this data into a cohesive paragraph: {ticker.summary_detail}. Then based on the information, make a prediction of what the stock will do in a second paragraph.")
        ai_summary = response.text
    else:
        ai_summary = "No relevant insider trading data found"

    return {
        "filtered_dataframe_ceo": filtered_dataframe_ceo.to_dict(orient='records'),
        "filtered_dataframe_pres": filtered_dataframe_pres.to_dict(orient='records'),
        "filtered_dataframe_cfo": filtered_dataframe_cfo.to_dict(orient='records'),
        "ai_summary": ai_summary
    }

@app.get("/")
def home():
    return {"message": "Welcome to the FastAPI Insider Trading API"}

@app.get("/scrape")
def get_scrape_data():
    """Endpoint to trigger scraping and AI analysis"""
    return scrape()