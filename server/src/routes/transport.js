const router = require('express').Router();

router.get('/routes', (req, res) => {
    try {
        const db = req.app.locals.db;
        
        // Join with staff to get driver name and phone
        const routes = db.prepare(`
            SELECT r.*, 
                   r.route_name as name,
                   r.vehicle_number as vehicleNumber,
                   s.first_name, s.last_name,
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as driverName,
                   s.phone as driverPhone
            FROM bus_routes r
            LEFT JOIN staff s ON r.driver_id = s.id
            ORDER BY r.id
        `).all();

        const allStops = db.prepare(`
            SELECT id, route_id, 
                   stop_name as name, 
                   stop_name as stopName, 
                   pickup_time as time, 
                   pickup_time as pickupTime, 
                   stop_order, lat, lng
            FROM bus_stops
            ORDER BY route_id, stop_order ASC
        `).all();

        const allAssignments = db.prepare(`
            SELECT st.student_id, st.route_id, st.stop_id,
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as studentName,
                   s.grade, s.section,
                   g.name as guardianName, g.phone as guardianPhone
            FROM student_transport st
            JOIN students s ON st.student_id = s.id
            LEFT JOIN guardians g ON s.id = g.student_id AND g.is_primary = 1
        `).all();

        for (let route of routes) {
            route.stops = allStops.filter(s => s.route_id === route.id);
            route.students = allAssignments.filter(a => a.route_id === route.id);
            route.assignedCount = route.students.length;
            route.availableSeats = Math.max(0, route.capacity - route.assignedCount);

            // Compute student count boarding per stop
            for (let stop of route.stops) {
                stop.studentCount = route.students.filter(st => st.stop_id === stop.id).length;
            }
        }

        res.json(routes);
    } catch (err) {
        console.error('Error fetching transport routes:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
