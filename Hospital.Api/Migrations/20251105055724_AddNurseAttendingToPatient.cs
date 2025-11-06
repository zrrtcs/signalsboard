using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Signalsboard.Hospital.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNurseAttendingToPatient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "nurse_attending",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "nurse_attending",
                table: "patients");
        }
    }
}
