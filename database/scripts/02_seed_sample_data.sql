-- ==============================================================================
-- Concurrent Appointment Booking API - Sample Seed Data
-- Script: 02_seed_sample_data.sql
-- Description: Seeds initial test users, doctors, patients, and appointment slots.
--              Deterministic IDs are set using IDENTITY_INSERT to support
--              automated testing, concurrency benchmarks, and realistic demo data.
-- ==============================================================================

USE CaritasHospitalDB;
GO

SET NOCOUNT ON;
GO

-- ==============================================================================
-- 1. Seed Users (Doctors & Patients)
-- ==============================================================================
SET IDENTITY_INSERT dbo.Users ON;

-- Doctor User Profiles
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 1)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (1, N'Dr. Arun Kumar', N'arun.kumar@caritas.org', '9876543201');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 2)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (2, N'Dr. Meera Nambiar', N'meera.nambiar@caritas.org', '9876543202');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 3)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (3, N'Dr. Suresh Menon', N'suresh.menon@caritas.org', '9876543203');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 4)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (4, N'Dr. Ananya Nair', N'ananya.nair@caritas.org', '9876543204');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5, N'Dr. Joseph Varghese', N'joseph.varghese@caritas.org', '9876543205');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 6)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (6, N'Dr. Fatima Zahra', N'fatima.zahra@caritas.org', '9876543206');
END

-- Patient User Profiles
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5001)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5001, N'Tom Mathew', N'tom.mathew@example.com', '9876543210');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5002)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5002, N'Rahul Raj', N'rahul.raj@example.com', '9876543211');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5003)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5003, N'Anjali Sharma', N'anjali.sharma@example.com', '9876543212');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5004)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5004, N'David Paul', N'david.paul@example.com', '9876543213');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5005)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5005, N'Priya Kurian', N'priya.kurian@example.com', '9876543214');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5006)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5006, N'Mohammed Al-Hassan', N'mohammed.hassan@example.com', '9876543215');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5007)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5007, N'Sneha Patel', N'sneha.patel@example.com', '9876543216');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = 5008)
BEGIN
    INSERT INTO dbo.Users (UserId, FullName, Email, Phone)
    VALUES (5008, N'George Mathew', N'george.mathew@example.com', '9876543217');
END

SET IDENTITY_INSERT dbo.Users OFF;
GO

-- ==============================================================================
-- 2. Seed Doctors (Linked 1-to-1 with Users)
-- ==============================================================================
SET IDENTITY_INSERT dbo.Doctors ON;

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 1)
BEGIN
    INSERT INTO dbo.Doctors (DoctorId, UserId) VALUES (1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 2)
BEGIN
    INSERT INTO dbo.Doctors (DoctorId, UserId) VALUES (2, 2);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 3)
BEGIN
    INSERT INTO dbo.Doctors (DoctorId, UserId) VALUES (3, 3);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 4)
BEGIN
    INSERT INTO dbo.Doctors (DoctorId, UserId) VALUES (4, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 5)
BEGIN
    INSERT INTO dbo.Doctors (DoctorId, UserId) VALUES (5, 5);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors WHERE DoctorId = 6)
BEGIN
    INSERT INTO dbo.Doctors (DoctorId, UserId) VALUES (6, 6);
END

SET IDENTITY_INSERT dbo.Doctors OFF;
GO

-- ==============================================================================
-- 3. Seed Patients (Linked 1-to-1 with Users)
-- ==============================================================================
SET IDENTITY_INSERT dbo.Patients ON;

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5001)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5001, 5001);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5002)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5002, 5002);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5003)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5003, 5003);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5004)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5004, 5004);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5005)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5005, 5005);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5006)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5006, 5006);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5007)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5007, 5007);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Patients WHERE PatientId = 5008)
BEGIN
    INSERT INTO dbo.Patients (PatientId, UserId) VALUES (5008, 5008);
END

SET IDENTITY_INSERT dbo.Patients OFF;
GO

-- ==============================================================================
-- 4. Seed AppointmentSlots
-- Note: Slot 101 is the primary target slot used for the concurrent booking test.
--       Slot 102 is used by the API integration test suite.
-- ==============================================================================
SET IDENTITY_INSERT dbo.AppointmentSlots ON;

-- Dr. Arun Kumar (DoctorId 1)
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 101)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (101, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 102)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (102, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 104)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (104, 1);
END

-- Dr. Meera Nambiar (DoctorId 2)
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 103)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (103, 2);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 105)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (105, 2);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 106)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (106, 2);
END

-- Dr. Suresh Menon (DoctorId 3)
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 107)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (107, 3);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 108)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (108, 3);
END

-- Dr. Ananya Nair (DoctorId 4)
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 109)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (109, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 110)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (110, 4);
END

-- Dr. Joseph Varghese (DoctorId 5)
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 111)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (111, 5);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 112)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (112, 5);
END

-- Dr. Fatima Zahra (DoctorId 6)
IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 113)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (113, 6);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 114)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (114, 6);
END

IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentSlots WHERE SlotId = 115)
BEGIN
    INSERT INTO dbo.AppointmentSlots (SlotId, DoctorId) VALUES (115, 6);
END

SET IDENTITY_INSERT dbo.AppointmentSlots OFF;
GO

PRINT 'CaritasHospitalDB: Sample data seeded successfully.';
GO
