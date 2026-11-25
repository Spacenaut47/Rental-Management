using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class EnforceDataIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Leases_LeaseId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Units_Properties_PropertyId",
                table: "Units");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequests_TenantId",
                table: "MaintenanceRequests",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequests_UnitId",
                table: "MaintenanceRequests",
                column: "UnitId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Properties_PropertyId",
                table: "MaintenanceRequests",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Tenants_TenantId",
                table: "MaintenanceRequests",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Units_UnitId",
                table: "MaintenanceRequests",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Leases_LeaseId",
                table: "Payments",
                column: "LeaseId",
                principalTable: "Leases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Units_Properties_PropertyId",
                table: "Units",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Properties_PropertyId",
                table: "MaintenanceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Tenants_TenantId",
                table: "MaintenanceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Units_UnitId",
                table: "MaintenanceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Leases_LeaseId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Units_Properties_PropertyId",
                table: "Units");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRequests_TenantId",
                table: "MaintenanceRequests");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRequests_UnitId",
                table: "MaintenanceRequests");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Leases_LeaseId",
                table: "Payments",
                column: "LeaseId",
                principalTable: "Leases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Units_Properties_PropertyId",
                table: "Units",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
