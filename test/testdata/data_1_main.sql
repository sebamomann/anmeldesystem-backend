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


-- ---------------------
-- WITH ADMINISTRATORS -
-- ---------------------
INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`, `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`) VALUES
('aa7a0cf0-9b32-4b74-8b52-de00d3d13e4b', 'test-getappointment-administrators-title', 'test-getappointment-administrators-description', 'test-getappointment-administrators-link', 'test-getappointment-administrators-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '0', '0', '9055cf00-0911-4311-9f3e-c3813dd4e4f9', '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;

INSERT INTO `administrator` (`id`, `userId`, `appointmentId`) VALUES
('0bde968c-8649-461e-be66-dbd3ed5b956c', '51a7fb18-1f44-4d13-ae30-d5e27d2621e0', 'aa7a0cf0-9b32-4b74-8b52-de00d3d13e4b');
COMMIT;


-- ----------------
-- WITH ADDITIONS -
-- ----------------
INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`, `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`) VALUES
('229135fa-d66f-4819-a375-82995d8203e6', 'test-getappointment-additions-title', 'test-getappointment-additions-description', 'test-getappointment-additions-link', 'test-getappointment-additions-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '0', '0', '9055cf00-0911-4311-9f3e-c3813dd4e4f9', '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;

INSERT INTO `addition` (`id`, `name`, `order`, `appointmentId`) VALUES
('28a03edc-cde5-4ce3-bb4c-04dcbe85f116', 'test-getappointment-additions-name-1', '0', '229135fa-d66f-4819-a375-82995d8203e6'),
('74b5eae6-1e5f-47eb-bf46-57f292f56e44', 'test-getappointment-additions-name-2', '1', '229135fa-d66f-4819-a375-82995d8203e6'),
('16a7edc6-c403-446f-89a1-f1a1d61f9ec9', 'test-getappointment-additions-name-3', '2', '229135fa-d66f-4819-a375-82995d8203e6'),
('ee59654b-b6cf-4ea2-81a2-8d097a54bd44', 'test-getappointment-additions-name-4', '3', '229135fa-d66f-4819-a375-82995d8203e6');
COMMIT;



-- ------------------
-- WITH ENROLLMENTS -
-- ------------------
-- ---------
-- DEFAULT -
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
-- -----------
-- ADDITIONS -
-- -----------
INSERT INTO `appointment` (`id`, `title`, `description`, `link`, `location`, `date`, `deadline`, `maxEnrollments`, `hidden`, `driverAddition`, `creatorId`, `iat`, `lud`) VALUES
('95245a48-ee00-4713-a74c-5b0c255b9c73', 'test-getappointment-enrollments-additions-title', 'test-getappointment-enrollments-additions-description', 'test-getappointment-enrollments-additions-link', 'test-getappointment-enrollments-additions-location', '2021-01-01 20:05:23', '2021-03-01 10:05:23', NULL, '0', '0', '9055cf00-0911-4311-9f3e-c3813dd4e4f9', '2021-03-14 20:05:23.000000', '2021-03-14 20:05:23.000000');
COMMIT;

INSERT INTO `addition` (`id`, `name`, `order`, `appointmentId`) VALUES
('1f5a1f1a-5114-403f-af2b-7d7c500b0f47', 'test-getappointment-enrollments-additions-name-1', '0', '95245a48-ee00-4713-a74c-5b0c255b9c73'),
('47c80bfd-3f31-43aa-9a9a-2c20e802c6cd', 'test-getappointment-enrollments-additions-name-2', '1', '95245a48-ee00-4713-a74c-5b0c255b9c73'),
('940758a2-2109-4f92-b6d0-deea0c6276b0', 'test-getappointment-enrollments-additions-name-3', '2', '95245a48-ee00-4713-a74c-5b0c255b9c73'),
('c7285e61-aa08-43ae-a0ee-e71a2db1db74', 'test-getappointment-enrollments-additions-name-4', '3', '95245a48-ee00-4713-a74c-5b0c255b9c73');
COMMIT;

INSERT INTO `enrollment` (`id`, `name`, `comment`, `creatorId`, `iat`, `lud`, `appointmentId`) VALUES
('5657eb58-427d-493c-ab88-1af2774572c2', 'test-getappointment-enrollments-additions-name-1-no-additions', 'test-getappointment-enrollments-additions-comment-1', NULL, '2021-01-01 05:05:23', '2021-03-01 05:05:23', '95245a48-ee00-4713-a74c-5b0c255b9c73'),
('ae279597-288b-4479-bc42-b9e887e9d958', 'test-getappointment-enrollments-additions-name-2-one-additions', 'test-getappointment-enrollments-additions-comment-2', NULL, '2021-01-01 05:06:23', '2021-03-01 05:06:23', '95245a48-ee00-4713-a74c-5b0c255b9c73'),
('83dd3d7e-de9f-4510-af91-b432c287aa96', 'test-getappointment-enrollments-additions-name-3-two-additions', 'test-getappointment-enrollments-additions-comment-3', NULL, '2021-01-01 05:07:23', '2021-03-01 05:07:23', '95245a48-ee00-4713-a74c-5b0c255b9c73'),
('ce3ad43e-5c3e-459e-8079-fd7c5c635578', 'test-getappointment-enrollments-additions-name-4-all-additions', 'test-getappointment-enrollments-additions-comment-4', NULL, '2021-01-01 05:08:23', '2021-03-01 05:08:23', '95245a48-ee00-4713-a74c-5b0c255b9c73');
COMMIT;

INSERT INTO `enrollment_addition` (`enrollmentId`, `additionId`) VALUES
('ae279597-288b-4479-bc42-b9e887e9d958', '1f5a1f1a-5114-403f-af2b-7d7c500b0f47'), /* addition 1 */
('83dd3d7e-de9f-4510-af91-b432c287aa96', '1f5a1f1a-5114-403f-af2b-7d7c500b0f47'), /* addition 1 */
('83dd3d7e-de9f-4510-af91-b432c287aa96', '940758a2-2109-4f92-b6d0-deea0c6276b0'), /* addition 3 */
('ce3ad43e-5c3e-459e-8079-fd7c5c635578', '1f5a1f1a-5114-403f-af2b-7d7c500b0f47'), /* addition 1 */
('ce3ad43e-5c3e-459e-8079-fd7c5c635578', '47c80bfd-3f31-43aa-9a9a-2c20e802c6cd'), /* addition 2 */
('ce3ad43e-5c3e-459e-8079-fd7c5c635578', '940758a2-2109-4f92-b6d0-deea0c6276b0'), /* addition 3 */
('ce3ad43e-5c3e-459e-8079-fd7c5c635578', 'c7285e61-aa08-43ae-a0ee-e71a2db1db74'); /* addition 4 */
COMMIT;

