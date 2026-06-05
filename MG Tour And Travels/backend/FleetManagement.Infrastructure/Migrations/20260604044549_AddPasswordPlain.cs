using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FleetManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordPlain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordPlain",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordPlain",
                table: "Users");
        }
    }
}
