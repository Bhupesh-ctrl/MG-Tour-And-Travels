using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FleetManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowDuplicateTripId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                -- 1. Drop foreign key in Earnings table
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Earnings_Trips_TripId' AND parent_object_id = OBJECT_ID('Earnings'))
                BEGIN
                    ALTER TABLE Earnings DROP CONSTRAINT FK_Earnings_Trips_TripId;
                END

                -- 2. Drop Trips table
                IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('Trips') AND type = 'U')
                BEGIN
                    DROP TABLE Trips;
                END

                -- 3. Recreate Trips table with Identity on Id
                CREATE TABLE Trips (
                    Id INT IDENTITY(1,1) NOT NULL,
                    VendorTripId INT NOT NULL DEFAULT 0,
                    CabId INT NOT NULL,
                    DriverId INT NOT NULL,
                    StartTime DATETIME2 NOT NULL,
                    EndTime DATETIME2 NULL,
                    StartOdometer INT NOT NULL,
                    EndOdometer INT NULL,
                    StartLocation NVARCHAR(MAX) NOT NULL,
                    EndLocation NVARCHAR(MAX) NULL,
                    PickupOrDrop NVARCHAR(MAX) NULL,
                    Status INT NOT NULL,
                    FuelConsumed DECIMAL(18,2) NULL,
                    FareAmount DECIMAL(18,2) NULL,
                    TollAmount DECIMAL(18,2) NULL,
                    Notes NVARCHAR(MAX) NULL,
                    IsActive BIT NOT NULL,
                    IsDeleted BIT NOT NULL,
                    CreatedDate DATETIME2 NOT NULL,
                    CreatedBy NVARCHAR(MAX) NOT NULL,
                    UpdatedDate DATETIME2 NULL,
                    UpdatedBy NVARCHAR(MAX) NOT NULL,
                    CONSTRAINT PK_Trips PRIMARY KEY (Id),
                    CONSTRAINT FK_Trips_Cabs_CabId FOREIGN KEY (CabId) REFERENCES Cabs (Id),
                    CONSTRAINT FK_Trips_Drivers_DriverId FOREIGN KEY (DriverId) REFERENCES Drivers (Id)
                );

                -- 4. Create Indexes
                CREATE INDEX IX_Trips_CabId ON Trips (CabId);
                CREATE INDEX IX_Trips_DriverId ON Trips (DriverId);

                -- 5. Set existing Earnings TripId references to NULL to prevent FK conflicts
                UPDATE Earnings SET TripId = NULL;

                -- 6. Recreate foreign key in Earnings table
                ALTER TABLE Earnings ADD CONSTRAINT FK_Earnings_Trips_TripId FOREIGN KEY (TripId) REFERENCES Trips (Id) ON DELETE SET NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Earnings_Trips_TripId' AND parent_object_id = OBJECT_ID('Earnings'))
                BEGIN
                    ALTER TABLE Earnings DROP CONSTRAINT FK_Earnings_Trips_TripId;
                END

                IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('Trips') AND type = 'U')
                BEGIN
                    DROP TABLE Trips;
                END

                CREATE TABLE Trips (
                    Id INT NOT NULL,
                    CabId INT NOT NULL,
                    DriverId INT NOT NULL,
                    StartTime DATETIME2 NOT NULL,
                    EndTime DATETIME2 NULL,
                    StartOdometer INT NOT NULL,
                    EndOdometer INT NULL,
                    StartLocation NVARCHAR(MAX) NOT NULL,
                    EndLocation NVARCHAR(MAX) NULL,
                    PickupOrDrop NVARCHAR(MAX) NULL,
                    Status INT NOT NULL,
                    FuelConsumed DECIMAL(18,2) NULL,
                    FareAmount DECIMAL(18,2) NULL,
                    TollAmount DECIMAL(18,2) NULL,
                    Notes NVARCHAR(MAX) NULL,
                    IsActive BIT NOT NULL,
                    IsDeleted BIT NOT NULL,
                    CreatedDate DATETIME2 NOT NULL,
                    CreatedBy NVARCHAR(MAX) NOT NULL,
                    UpdatedDate DATETIME2 NULL,
                    UpdatedBy NVARCHAR(MAX) NOT NULL,
                    CONSTRAINT PK_Trips PRIMARY KEY (Id),
                    CONSTRAINT FK_Trips_Cabs_CabId FOREIGN KEY (CabId) REFERENCES Cabs (Id),
                    CONSTRAINT FK_Trips_Drivers_DriverId FOREIGN KEY (DriverId) REFERENCES Drivers (Id)
                );

                CREATE INDEX IX_Trips_CabId ON Trips (CabId);
                CREATE INDEX IX_Trips_DriverId ON Trips (DriverId);

                ALTER TABLE Earnings ADD CONSTRAINT FK_Earnings_Trips_TripId FOREIGN KEY (TripId) REFERENCES Trips (Id) ON DELETE SET NULL;
            ");
        }
    }
}
