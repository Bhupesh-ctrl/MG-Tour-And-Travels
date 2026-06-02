IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [TableName] nvarchar(max) NOT NULL,
    [Action] nvarchar(max) NOT NULL,
    [KeyValues] nvarchar(max) NOT NULL,
    [OldValues] nvarchar(max) NOT NULL,
    [NewValues] nvarchar(max) NOT NULL,
    [ChangedBy] nvarchar(max) NOT NULL,
    [ChangedDate] datetime2 NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE TABLE [Cabs] (
    [Id] int NOT NULL IDENTITY,
    [VehicleNumber] nvarchar(450) NOT NULL,
    [Model] nvarchar(max) NOT NULL,
    [Make] nvarchar(max) NOT NULL,
    [Year] int NOT NULL,
    [Color] nvarchar(max) NOT NULL,
    [FuelType] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Cabs] PRIMARY KEY ([Id])
);

CREATE TABLE [Documents] (
    [Id] int NOT NULL IDENTITY,
    [EntityType] int NOT NULL,
    [EntityId] int NOT NULL,
    [DocumentType] int NOT NULL,
    [DocumentUrl] nvarchar(max) NOT NULL,
    [ExpiryDate] datetime2 NULL,
    [Status] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Documents] PRIMARY KEY ([Id])
);

CREATE TABLE [DriverOtps] (
    [Id] int NOT NULL IDENTITY,
    [Phone] nvarchar(max) NOT NULL,
    [OtpCode] nvarchar(max) NOT NULL,
    [ExpiryTime] datetime2 NOT NULL,
    [IsUsed] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    CONSTRAINT [PK_DriverOtps] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Username] nvarchar(450) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Phone] nvarchar(450) NOT NULL,
    [Role] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [Drivers] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [LicenseNumber] nvarchar(max) NOT NULL,
    [LicenseExpiryDate] datetime2 NOT NULL,
    [Address] nvarchar(max) NOT NULL,
    [VerificationStatus] int NOT NULL,
    [CurrentCabId] int NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Drivers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Drivers_Cabs_CurrentCabId] FOREIGN KEY ([CurrentCabId]) REFERENCES [Cabs] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Drivers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Expenses] (
    [Id] int NOT NULL IDENTITY,
    [DriverId] int NULL,
    [CabId] int NULL,
    [ExpenseDate] datetime2 NOT NULL,
    [Category] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [ReceiptUrl] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Expenses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Expenses_Cabs_CabId] FOREIGN KEY ([CabId]) REFERENCES [Cabs] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Expenses_Drivers_DriverId] FOREIGN KEY ([DriverId]) REFERENCES [Drivers] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [Targets] (
    [Id] int NOT NULL IDENTITY,
    [DriverId] int NOT NULL,
    [TargetType] int NOT NULL,
    [MetricType] int NOT NULL,
    [TargetValue] decimal(18,2) NOT NULL,
    [CurrentValue] decimal(18,2) NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [Status] int NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Targets] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Targets_Drivers_DriverId] FOREIGN KEY ([DriverId]) REFERENCES [Drivers] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Trips] (
    [Id] int NOT NULL,
    [CabId] int NOT NULL,
    [DriverId] int NOT NULL,
    [StartTime] datetime2 NOT NULL,
    [EndTime] datetime2 NULL,
    [StartOdometer] int NOT NULL,
    [EndOdometer] int NULL,
    [StartLocation] nvarchar(max) NOT NULL,
    [EndLocation] nvarchar(max) NULL,
    [Status] int NOT NULL,
    [FuelConsumed] decimal(18,2) NULL,
    [FareAmount] decimal(18,2) NULL,
    [TollAmount] decimal(18,2) NULL,
    [Notes] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Trips] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Trips_Cabs_CabId] FOREIGN KEY ([CabId]) REFERENCES [Cabs] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Trips_Drivers_DriverId] FOREIGN KEY ([DriverId]) REFERENCES [Drivers] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Earnings] (
    [Id] int NOT NULL IDENTITY,
    [TripId] int NULL,
    [DriverId] int NOT NULL,
    [Date] datetime2 NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Source] int NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [IsDeleted] bit NOT NULL,
    [CreatedDate] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NOT NULL,
    [UpdatedDate] datetime2 NULL,
    [UpdatedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Earnings] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Earnings_Drivers_DriverId] FOREIGN KEY ([DriverId]) REFERENCES [Drivers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Earnings_Trips_TripId] FOREIGN KEY ([TripId]) REFERENCES [Trips] ([Id]) ON DELETE SET NULL
);

CREATE UNIQUE INDEX [IX_Cabs_VehicleNumber] ON [Cabs] ([VehicleNumber]);

CREATE INDEX [IX_Drivers_CurrentCabId] ON [Drivers] ([CurrentCabId]);

CREATE INDEX [IX_Drivers_UserId] ON [Drivers] ([UserId]);

CREATE INDEX [IX_Earnings_DriverId] ON [Earnings] ([DriverId]);

CREATE INDEX [IX_Earnings_TripId] ON [Earnings] ([TripId]);

CREATE INDEX [IX_Expenses_CabId] ON [Expenses] ([CabId]);

CREATE INDEX [IX_Expenses_DriverId] ON [Expenses] ([DriverId]);

CREATE INDEX [IX_Targets_DriverId] ON [Targets] ([DriverId]);

CREATE INDEX [IX_Trips_CabId] ON [Trips] ([CabId]);

CREATE INDEX [IX_Trips_DriverId] ON [Trips] ([DriverId]);

CREATE UNIQUE INDEX [IX_Users_Phone] ON [Users] ([Phone]) WHERE [Phone] IS NOT NULL;

CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]) WHERE [Username] IS NOT NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260528194345_InitialCreate', N'9.0.0');

ALTER TABLE [Trips] ADD [PickupOrDrop] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260528200150_AddPickupOrDropToTrip', N'9.0.0');

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Drivers]') AND [c].[name] = N'LicenseNumber');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Drivers] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Drivers] ALTER COLUMN [LicenseNumber] nvarchar(max) NULL;

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Drivers]') AND [c].[name] = N'LicenseExpiryDate');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Drivers] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Drivers] ALTER COLUMN [LicenseExpiryDate] datetime2 NULL;

ALTER TABLE [Drivers] ADD [Salary] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [Documents] ADD [Title] nvarchar(max) NOT NULL DEFAULT N'';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260529133009_AddSalaryAndDocumentTitle', N'9.0.0');

COMMIT;
GO

