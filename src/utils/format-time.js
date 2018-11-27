const formatTime = datetime => {
    const d = new Date(datetime);
 
    const date = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    const formattedTime = d.toLocaleTimeString();
    const formattedDate = [year, month, date].join('.');

    return `${formattedDate} - ${formattedTime}`;
}

export default formatTime;
