import pandas as pd
from pymongo import MongoClient

df = pd.read_csv('mock_data_healthProviders.csv')


collection = client.get_database('sehat').get_collection('healthproviders')


count = 0

for index, row in df.iterrows():
    doc = row.to_dict()
    result = collection.insert_one(doc)
    print(result.inserted_id)