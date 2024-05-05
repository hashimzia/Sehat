import pandas as pd
from os import system
from pymongo import MongoClient

client = MongoClient('mongodb+srv://adamsharifc:65pGboI88n4E79Yg@cluster0.0pbi3kr.mongodb.net/sehat?retryWrites=true&w=majority')

collection = client.get_database('sehat').get_collection('healthprovidersschedules')

count = collection.count_documents({})

# add new data
doc = {
    'weekday_availability': {
        'Monday': [{
            'start': '09:00',
            'end': '17:00'
        }],
        'Tuesday': [{
            'start': '09:00',
            'end': '17:00'
        }],
        'Wednesday': [{
            'start': '09:00',
            'end': '17:00'
        }],
        'Thursday': [{
            'start': '09:00',
            'end': '17:00'
        }],
        'Friday': [{
            'start': '09:00',
            'end': '17:00'
        }],
        'Saturday': [],
        'Sunday': []
    },
    'slot_duration_minutes': 30
}



df = pd.read_csv('mock_data_healthProviders.csv')
count = 0
for index, row in df.iterrows():
    id_ = row['provider_id']
    doc['provider_id'] = id_
    result = collection.insert_one(doc)
    del doc['_id']
    count += 1
    print(f'Inserted {count} documents')
    # if count >= 100: break

# # Get the last 100 documents
# cursor = collection.find().sort([("$natural", -1)]).limit(100)

# # Delete each document
# for doc in cursor:
#     collection.delete_one({"_id": doc["_id"]})