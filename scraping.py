from bs4 import BeautifulSoup
from openai import OpenAI
import requests 
import pandas as pd 
import google.generativeai as genai
import schedule
import time 


def scrape():

    #Twilio stuff 
    # TEST_ACCOUNT_SID = 'ACdae5c28ff6596dbc44a4979aefb1104e'
    # TEST_AUTH_TOKEN = '6b6b1e234a214ae0ae5a88e57fc9f978'
    # TWILIO_NUM = '+18338534135'
    # MY_NUM = '+167829617654'
    # ACCOUNT_SID = 'ACf9ca1fc2b76950eb57b969d81f4c6e87'
    # AUTH_TOKEN = '44bd3bc05456e2781ce4bbd373e41d25'
    # TWILIO_NUM = '+18338534135'
    # MY_NUM = '+16782961764'


    gemini_key  = 'AIzaSyBjo1vfnMFrvdeNMW68hq2Fxjzgc5S5298'


    #Scraping from insider 
    url = 'http://openinsider.com/insider-purchases-25k'
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'html')
    latest_insider_purchase_table = soup.find_all('table')[11]
    headers = latest_insider_purchase_table.find_all('th')

    #Getting data and cleaning it up
    header_titles = [ title.text.strip().replace('\xa0', ' ') for title in headers ]
    dataframe = pd.DataFrame( columns= header_titles)
    column_data = latest_insider_purchase_table.find_all('tr')

    #Creating the dataframe
    for row in column_data[1:]:
        row_data = row.find_all('td')
        each_row_data = [individual_data.text.strip() for individual_data in row_data]
        length = len(dataframe)
        dataframe.loc[length] = each_row_data

    # Turning the percentage into integers and putting them back in DF to compare
    dataframe.iloc[:, 11] = dataframe.iloc[:, 11].replace('%', '', regex=True)
    dataframe.iloc[:, 11] = pd.to_numeric(dataframe.iloc[:, 11], errors='coerce')

    dataframe.iloc[:, 11] = dataframe.iloc[:,11].fillna(0)
    dataframe.iloc[:, 11] = dataframe.iloc[:, 11].astype(int)

    
    filtered_dataframe_ceo = dataframe[(dataframe.iloc[:, 11] > 40) & (dataframe['Title'] == 'CEO')]
    filtered_dataframe_cfo = dataframe[(dataframe.iloc[:, 11] > 10) & (dataframe['Title'] == 'CFO')]


    print(filtered_dataframe_ceo)
    print("____________________________________________________________________________________________________________________________________________________________________________________")
    print(filtered_dataframe_cfo)


    # client = OpenAI()
    # completion = client.chat.completions.create(
    #     model="gpt-4o-mini",
    #     messages=[
    #         {"role": "system", "content": "You are a helpful assistant."},
    #         {
    #             "role": "user",
    #             "content": "Write a haiku about recursion in programming."
    #         }
    #     ]
    # )
    # print(completion.choices[0].message)

    # genai.configure(api_key="YOUR_API_KEY")
    # model = genai.GenerativeModel("gemini-1.5-flash")
    # response = model.generate_content("Explain how AI works")
    # print(response.text)


scrape()
   


# schedule.every(10).seconds.do(scrape)
# while 1:
#     schedule.run_pending()
#     time.sleep(1)


