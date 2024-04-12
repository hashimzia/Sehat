import { config } from "dotenv";
import { Timestamp } from "mongodb";
config();
import mongoose from 'mongoose';

const dbConnection = mongoose
    })
    .then(() => console.log('MongoDB database Connected '))
    .catch((err) => console.log(err))


const HealthProviders = new mongoose.Schema({
    provider_id: String,
    first_name: String,
    last_name: String,
    email: String,
    phone_number: String,
    specialty: String,
    city: String,
    street_address: String,
    years_of_experience: Number,
});
mongoose.model('healthproviders', HealthProviders);

HealthProviders.index({
    "first_name": "text",
    "last_name": "text",
    "email": "text",
    "specialty": "text",
    "city": "text",
})

const Reviews = new mongoose.Schema({
    provider_id: String,
    patient_id: String,
    review: String,
    rating: Number,
    timestamp: { type: Date, default: Date.now },
});
mongoose.model('reviews', Reviews);

const HealthProvidersRatings = new mongoose.Schema({
    provider_id: String,
    total_rating: Number,
    total_reviews: Number
})
mongoose.model('healthprovidersratings', HealthProvidersRatings);


export default dbConnection;