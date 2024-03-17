import React from "react"
import styles from "./AppointmentBookingPage.module.css"
import { Calendar } from "@/components/ui/calendar"


const slots = [
    {text: "9:00 AM"},
    {text: "10:00 AM"},
    {text: "11:00 AM"},
    {text: "12:00 PM"},
    {text: "1:00 PM"},
    {text: "2:00 PM"},
    {text: "3:00 PM"},
]


function AppointmentBookingPage(){
    const [date, setDate] = React.useState(new Date())

    return (
        <>
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <h3>Select a Date & Time</h3>
                    <hr className={styles.divider}/>
                    <div style={{display: "flex", flexDirection: "row", gap: "1rem", alignItems: "center"}}>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                        />
                        <div className="slot-container">
                            {slots.map((slot, index) => (
                                <Slot key={index} text={slot.text} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}


function Slot({text}){

    const [selected, setSelected] = React.useState(false)
    
    return (
        <div className={styles.slot } onClick={()=> {setSelected(!selected)}}>
            <div className={styles.text}>{text}</div>
        </div>
    )
}

export default AppointmentBookingPage;