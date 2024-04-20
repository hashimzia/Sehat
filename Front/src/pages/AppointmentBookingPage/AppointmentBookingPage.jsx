import React, { useRef, useEffect, useState} from "react"
import styles from "./AppointmentBookingPage.module.css"
import { Calendar } from "@/components/ui/calendar"
import '../../index.css'

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

    // const [questionIndex, setQuestionIndex] = React.useState(0)
    // const [reason, setReason] = React.useState("")
    // const [location, setLocation] = React.useState("")
    // const [speciality, setSpeciality] = React.useState("")
    // const [time, setTime] = React.useState("")

    // const questions = [
    //     {prompt: "What is the reason for your visit?", setAnswer: setReason},
    //     {prompt: "Where would you like to have your appointment?", setAnswer: setLocation},
    //     {prompt: "What is your speciality?", setAnswer: setSpeciality},
    //     {prompt: "What time would you like to have your appointment?", setAnswer: setTime},
    // ]

    // const handleKeyDown = (event) => {
    //     if (event.key === "Enter"){
    //         setQuestionIndex((prevIndex) => prevIndex + 1)
    //     }
    // }


    // return (
    //     <>
    //         <div className={styles.wrapper} onKeyDown={handleKeyDown}>
    //             <Question prompt={questions[questionIndex].prompt} setAnswer={questions[questionIndex].setAnswer} />
            
    //         </div>
    //     </>
    // )

    return (
        <>
        <DateSlotInput/>
        </>
    )
}


function Question({ prompt, setAnswer }) {
    const inputRef = useRef();
    useEffect(() => {
        inputRef.current.focus();
    }, []);

    // Define the array of background colors
    const bgColors = [
        "var(--question-color-1)",
        "var(--question-color-2)",
        "var(--question-color-3)",
        "var(--question-color-4)",
        "var(--question-color-5)",
        "var(--question-color-6)",
        "var(--question-color-7)"
    ];

    // State to hold the random background color
    const [randomColor] = useState(() => {
        // Initialize with a random color
        return bgColors[Math.floor(Math.random() * bgColors.length)];
    });

    return (
        <div className={styles.question} style={{ backgroundColor: randomColor }}>
            <div className={styles.questionWrapper}>
                <span className={styles.prompt}>{prompt}</span>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type here"
                    className={styles.input}
                    onChange={(e) => setAnswer(e.target.value)}>
                </input>
            </div>
        </div>
    );
}

function DateSlotInput(){
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