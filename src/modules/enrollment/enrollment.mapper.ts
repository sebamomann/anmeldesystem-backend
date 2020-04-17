const passengerMapper = require('./passenger/passenger.mapper');
const driverMapper = require('./driver/driver.mapper');

module.exports = {
    basic: function(enrollmentService, _enrollment) {
        let enrollment;

        enrollment = (({
                           id,
                           name,
                           comment,
                           additions,
                           comments,
                       }) => ({
            id,
            name,
            comment,
            additions,
            comments,
        }))
        (_enrollment);

        enrollment.createdByUser = _enrollment.creator !== null
            && _enrollment.creator !== undefined;

        if (_enrollment.token !== undefined) {
            enrollment.token = _enrollment.token;
        }

        if (_enrollment.driver !== undefined
            && _enrollment.driver !== null) {
            enrollment.driver = driverMapper.basic(_enrollment.driver);
        }

        if (_enrollment.passenger !== undefined
            && _enrollment.passenger !== null) {
            enrollment.passenger = passengerMapper.basic(_enrollment.passenger);
        }

        return enrollment;
    },
};
