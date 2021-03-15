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



-- ###########################
-- # GET APPOINTMENT BY LINK #
-- ###########################

-- ---------
-- DEFAULT -
-- ---------
-- JWT_User with ID 9055cf00-0911-4311-9f3e-c3813dd4e4f9 // APPOINTMENT CREATOR
-- JWT_User with ID 51a7fb18-1f44-4d13-ae30-d5e27d2621e0 // APPOINTMENT ADMIN
-- JWT_User with ID 0f72f964-a0b2-4347-9e52-9d2cd2441849 // ENROLLMENT CREATOR

-- ---------
-- DEFAULT -
-- ---------
INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`, `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`) VALUES
('5163f213-c168-408c-ad63-4faa7ec61ae5', 'test-getappointment-default-title', 'test-getappointment-default-description', 'test-getappointment-default-link', 'test-getappointment-default-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '0', '0', '9055cf00-0911-4311-9f3e-c3813dd4e4f9', '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;


-- ------------------
-- WITH ENROLLMENTS -
-- ------------------
-- ---------
-- PRESENT -
-- ---------
INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`, `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`) VALUES
('8d397266-75f5-413c-a9b4-3237e50c7852', 'test-getappointment-enrollments-title', 'test-getappointment-enrollments-description', 'test-getappointment-enrollments-link', 'test-getappointment-enrollments-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '0', '0', '9055cf00-0911-4311-9f3e-c3813dd4e4f9', '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;

INSERT INTO `enrollment` (`id`, `name`, `comment`, `creatorId`, `iat`, `lud`, `appointmentId`) VALUES
('b1bc5530-c9cc-40c1-9280-cf99ec6cc63d', 'test-getappointment-enrollments-name-1', 'test-getappointment-enrollments-comment-1', NULL, '2021-01-01 05:05:23', '2021-03-01 05:05:23', '8d397266-75f5-413c-a9b4-3237e50c7852'),
('14bba460-69d8-4238-8d79-5e2106d2998e', 'test-getappointment-enrollments-name-2', 'test-getappointment-enrollments-comment-2', NULL, '2021-01-01 05:06:23', '2021-03-01 05:06:23', '8d397266-75f5-413c-a9b4-3237e50c7852'),
('77fd09fb-f44b-4646-9e47-e45a0e8d7fc1', 'test-getappointment-enrollments-name-3', 'test-getappointment-enrollments-comment-3', NULL, '2021-01-01 05:07:23', '2021-03-01 05:07:23', '8d397266-75f5-413c-a9b4-3237e50c7852'),
('33d5cc7c-7278-4ce5-bd1d-d5a527e315c8', 'test-getappointment-enrollments-name-4', 'test-getappointment-enrollments-comment-4', NULL, '2021-01-01 05:08:23', '2021-03-01 05:08:23', '8d397266-75f5-413c-a9b4-3237e50c7852'),
('7e826bb0-0008-4503-86fa-7ea9f10525d1', NULL, 'test-getappointment-enrollments-comment-5-creator', '0f72f964-a0b2-4347-9e52-9d2cd2441849', '2021-01-01 05:09:23', '2021-03-01 05:09:23', '8d397266-75f5-413c-a9b4-3237e50c7852');
COMMIT;


-- ---------
-- HIDDEN -
-- ---------


INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`, `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`) VALUES
('e0655f6b-b2a9-42f1-8ce3-3492c1af257f', 'test-getappointment-enrollments-hidden-title', 'test-getappointment-enrollments-hidden-description', 'test-getappointment-enrollments-hidden-link', 'test-getappointment-enrollments-hidden-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '1', '0', '9055cf00-0911-4311-9f3e-c3813dd4e4f9', '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;

INSERT INTO `administrator` (`id`, `userId`, `appointmentId`) VALUES
('2311d865-1537-4b26-9374-d0b2753ba5b9', '51a7fb18-1f44-4d13-ae30-d5e27d2621e0', 'e0655f6b-b2a9-42f1-8ce3-3492c1af257f');
COMMIT;

INSERT INTO `enrollment` (`id`, `name`, `comment`, `creatorId`, `iat`, `lud`, `appointmentId`) VALUES
('76975e00-00d2-4b38-b300-4f30d7c2d9de', 'test-getappointment-enrollments-hidden-name-1', 'test-getappointment-enrollments-hidden-comment-1', NULL, '2021-01-01 05:05:23', '2021-03-01 05:05:23', 'e0655f6b-b2a9-42f1-8ce3-3492c1af257f'),
('e0d6c93e-87d9-41c5-b4f5-e53e50b66acd', 'test-getappointment-enrollments-hidden-name-2', 'test-getappointment-enrollments-hidden-comment-2', NULL, '2021-01-01 05:06:23', '2021-03-01 05:06:23', 'e0655f6b-b2a9-42f1-8ce3-3492c1af257f'),
('d07dcb9c-27cd-436d-88b5-3a1bd6253d11', 'test-getappointment-enrollments-hidden-name-3', 'test-getappointment-enrollments-hidden-comment-3', NULL, '2021-01-01 05:07:23', '2021-03-01 05:07:23', 'e0655f6b-b2a9-42f1-8ce3-3492c1af257f'),
('b31c6c83-c4b3-4526-a94b-703f837be105', 'test-getappointment-enrollments-hidden-name-4', 'test-getappointment-enrollments-hidden-comment-4', NULL, '2021-01-01 05:08:23', '2021-03-01 05:08:23', 'e0655f6b-b2a9-42f1-8ce3-3492c1af257f'),
('1de9808d-b203-40c3-b6c3-184dd58bfa48', NULL, 'test-getappointment-enrollments-hidden-comment-5-creator', '0f72f964-a0b2-4347-9e52-9d2cd2441849', '2021-01-01 05:09:23', '2021-03-01 05:09:23', 'e0655f6b-b2a9-42f1-8ce3-3492c1af257f');
COMMIT;

