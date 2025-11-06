using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Signalsboard.Hospital.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddInjectionModeToPatient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "injection_mode_enabled",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "injection_mode_enabled",
                table: "patients");
        }
    }
}
