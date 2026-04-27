using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eTracker.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductNameToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProductName",
                table: "Transactions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductName",
                table: "Transactions");
        }
    }
}
