function generateSlots(start_time, end_time, slot_duration_minutes, booked_slots){
    // generate slots for a given time range
    // also remove slots that have overlapping booked slots
    let slots = [];
    let current_time = start_time;
    while(current_time < end_time){
      let slot = {
        start_time: current_time,
        end_time: new Date(current_time.getTime() + slot_duration_minutes*60000),
        slot_duration_minutes: slot_duration_minutes
      }
      let is_booked = false;
      for(let i=0; i<booked_slots.length; i++){
        if((slot.start_time >= booked_slots[i].start_time && slot.start_time < booked_slots[i].end_time) || 
           (slot.end_time > booked_slots[i].start_time && slot.end_time <= booked_slots[i].end_time)){
          is_booked = true;
          break;
        }
      }
      if(!is_booked){
        slots.push(slot);
      }
      current_time = new Date(current_time.getTime() + slot_duration_minutes*60000);
    }
    return slots;
}
export {generateSlots};