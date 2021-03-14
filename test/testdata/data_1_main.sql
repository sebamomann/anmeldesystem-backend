-- ######################
-- # CREATE APPOINTMENT #
-- ######################

-- ---------
-- DEFAULT -
-- ---------
-- JWT_User with ID f406c1a0-ea46-4229-a83e-bba9b5d2f313

-- --------------------
-- FOR FAILURE - AUTH -
-- --------------------
INSERT INTO `link` (`id`, `short`, `original`, `isActive`, `iat`, `creatorId`) VALUES
('07ce868f-a293-46be-afd1-1e3e2b38b691', 'test-createlink-existingshort-short', 'https://dein.li', 1, '2021-02-07 12:59:00.596617', NULL);
COMMIT;
