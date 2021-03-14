-- ######################
-- # CREATE APPOINTMENT #
-- ######################

-- ---------
-- DEFAULT -
-- ---------
-- JWT_User with ID c9eee8c1-e701-4a3d-8cb9-6e7cd1209aba

-- -------------
-- FOR FAILURE -
-- -------------
INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`,
                           `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`)
VALUES ('1823042c-4282-49d4-9e0f-eed859d34b62', 'test-createappointment-existinglink-title',
        'test-createappointment-existinglink-description', 'test-createappointment-existinglink-link',
        'test-createappointment-existinglink-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '0', '0',
        NULL, '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;
