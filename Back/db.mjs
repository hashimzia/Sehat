import { config } from "dotenv";
config();
import mongoose from 'mongoose';

const dbConnection = mongoose
    .connect(process.env.MONGO_URI, {
    })
    .then(() => console.log('MongoDB database Connected '))
    .catch((err) => console.log(err))


const HealthProviders = new mongoose.Schema({
    // wo bhi kya din the jab humne yeh schema banaya tha
    userId: String,
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
    is_anonymous: Boolean,
    timestamp: { type: Date, default: Date.now },
});
mongoose.model('reviews', Reviews);

const HealthProvidersRatings = new mongoose.Schema({
    provider_id: String,
    total_rating: Number,
    total_reviews: Number
})
mongoose.model('healthprovidersratings', HealthProvidersRatings);

const HealthProvidersSchedule = new mongoose.Schema({
    provider_id: String,
    weekday_availability: {
        Monday: Array,
        Tuesday: Array,
        Wednesday: Array,
        Thursday: Array,
        Friday: Array,
        Saturday: Array,
        Sunday: Array
    },
    slot_duration_minutes: Number,
})
mongoose.model('healthprovidersschedule', HealthProvidersSchedule);

const BookedSlots = new mongoose.Schema({
    provider_id: String,
    patient_id: String,
    date: Date,
    start_time: String,
    end_time: String,
    slot_duration_minutes: Number,
    meeting: Object
});
mongoose.model('bookedslots', BookedSlots);

const PrescriptionSchema = new mongoose.Schema({
    provider_id: String,
    patient_id: String,
    medication: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String
    }],
    prescription_date: { type: Date, default: Date.now },
    instructions: String
});
mongoose.model('prescriptions', PrescriptionSchema);

const PatientSchema = new mongoose.Schema({
    patient_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    dob: { type: Date, required: true },
    height: { type: Number, required: true },
    blood_group: { type: String, required: true },
    gender: { type: String, required: true },
});

// Register the Patient model with Mongoose
mongoose.model('patients', PatientSchema);


export default dbConnection;