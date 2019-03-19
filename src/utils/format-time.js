const formatTime = datetime => {
  const d = new Date(datetime);
  return `${d.toDateString()} ${d.toLocaleTimeString()}`;
};

export default formatTime;
