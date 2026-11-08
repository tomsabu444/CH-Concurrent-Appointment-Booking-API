-- ==============================================================================
-- Concurrent Appointment Booking API - Database & Schema Definition
-- Script: 01_create_database_and_tables.sql
-- Description: Creates the CaritasHospitalDB database, tables, relational
--              constraints, unique checks for concurrency safety, and indexes.
-- ==============================================================================

-- 1. Create Database if not exists
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'CaritasHospitalDB')
BEGIN
    CREATE DATABASE CaritasHospitalDB;
END
GO

USE CaritasHospitalDB;
GO

-- Set required ANSI options
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==============================================================================
-- 2. Table: Users
-- Description: Central repository for user identity and profile information.
-- ==============================================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserId          INT IDENTITY(1, 1) NOT NULL,
        FullName        NVARCHAR(100) NOT NULL,
        Email           NVARCHAR(150) NULL,
        Phone           VARCHAR(15) NULL,
        CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserId)
    );
END
GO

-- ==============================================================================
-- 3. Table: Doctors
-- Description: Doctor profile entity linked 1-to-1 with Users.
-- ==============================================================================
IF OBJECT_ID(N'dbo.Doctors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Doctors (
        DoctorId        INT IDENTITY(1, 1) NOT NULL,
        UserId          INT NOT NULL,
        CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Doctors_CreatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Doctors PRIMARY KEY CLUSTERED (DoctorId),
        CONSTRAINT UQ_Doctors_UserId UNIQUE (UserId),
        CONSTRAINT FK_Doctors_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
    );
END
GO

-- ==============================================================================
-- 4. Table: Patients
-- Description: Patient profile entity linked 1-to-1 with Users.
-- ==============================================================================
IF OBJECT_ID(N'dbo.Patients', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Patients (
        PatientId       INT IDENTITY(5001, 1) NOT NULL,
        UserId          INT NOT NULL,
        CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Patients_CreatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Patients PRIMARY KEY CLUSTERED (PatientId),
        CONSTRAINT UQ_Patients_UserId UNIQUE (UserId),
        CONSTRAINT FK_Patients_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
    );
END
GO

-- ==============================================================================
-- 5. Table: AppointmentSlots
-- Note: IsBooked is intentionally NOT stored here. Availability is derived from
--       Appointments table via LEFT JOIN (SlotId IS NULL) to maintain single
--       source of truth and eliminate race condition inconsistencies.
-- ==============================================================================
IF OBJECT_ID(N'dbo.AppointmentSlots', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AppointmentSlots (
        SlotId          INT IDENTITY(101, 1) NOT NULL,
        DoctorId        INT NOT NULL,
        CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_AppointmentSlots_CreatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_AppointmentSlots PRIMARY KEY CLUSTERED (SlotId),
        CONSTRAINT FK_AppointmentSlots_Doctors FOREIGN KEY (DoctorId)
            REFERENCES dbo.Doctors(DoctorId) ON DELETE NO ACTION
    );
END
GO

-- ==============================================================================
-- 6. Table: Appointments
-- Note: UQ_Appointments_SlotId is the core database-level lock guaranteeing
--       that a slot can NEVER be booked more than once, regardless of race conditions.
-- ==============================================================================
IF OBJECT_ID(N'dbo.Appointments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Appointments (
        AppointmentId   INT IDENTITY(1, 1) NOT NULL,
        SlotId          INT NOT NULL,
        PatientId       INT NOT NULL,
        BookedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Appointments_BookedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Appointments PRIMARY KEY CLUSTERED (AppointmentId),
        CONSTRAINT UQ_Appointments_SlotId UNIQUE (SlotId),
        CONSTRAINT FK_Appointments_Slots FOREIGN KEY (SlotId)
            REFERENCES dbo.AppointmentSlots(SlotId) ON DELETE NO ACTION,
        CONSTRAINT FK_Appointments_Patients FOREIGN KEY (PatientId)
            REFERENCES dbo.Patients(PatientId) ON DELETE NO ACTION
    );
END
GO

-- ==============================================================================
-- 7. Indexes for Performance & Concurrency Locking Optimization
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Doctors_UserId' AND object_id = OBJECT_ID(N'dbo.Doctors'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Doctors_UserId
    ON dbo.Doctors(UserId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Patients_UserId' AND object_id = OBJECT_ID(N'dbo.Patients'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Patients_UserId
    ON dbo.Patients(UserId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AppointmentSlots_DoctorId' AND object_id = OBJECT_ID(N'dbo.AppointmentSlots'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AppointmentSlots_DoctorId 
    ON dbo.AppointmentSlots(DoctorId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Appointments_PatientId' AND object_id = OBJECT_ID(N'dbo.Appointments'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Appointments_PatientId 
    ON dbo.Appointments(PatientId) 
    INCLUDE (SlotId, BookedAt);
END
GO
