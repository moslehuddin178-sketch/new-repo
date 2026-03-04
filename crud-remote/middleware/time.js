const timeLimitMiddleware = (req, res, next) => {
  // 1. Get the current hour specifically for Finland
  // This is dynamic: it runs every time the route is hit
  const finlandTime = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Helsinki",
    hour: 'numeric',
    hour12: true
  });

  const currentHour = parseInt(finlandTime);
    console.log('Current Finnish Hour:', currentHour); // Debugging log

  const isOpen = currentHour >= 10 && currentHour < 1; // 10:00 to 12:59 are allowed

  if (!isOpen) {
    return res.status(403).json({
      message: "Access Denied: Updates allowed only between 10:00 and 17:00 Finnish time.",
      currentFinnishHour: `${currentHour}:00`
    });
  }

  next(); 
};

module.exports = timeLimitMiddleware;