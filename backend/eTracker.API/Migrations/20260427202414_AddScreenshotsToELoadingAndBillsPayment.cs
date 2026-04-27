using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eTracker.API.Migrations
{
    /// <inheritdoc />
    public partial class AddScreenshotsToELoadingAndBillsPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "ScreenshotContent",
                table: "ELoadingTransactions",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScreenshotContentType",
                table: "ELoadingTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScreenshotUrl",
                table: "ELoadingTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "ScreenshotContent",
                table: "BillsPaymentTransactions",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScreenshotContentType",
                table: "BillsPaymentTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScreenshotUrl",
                table: "BillsPaymentTransactions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScreenshotContent",
                table: "ELoadingTransactions");

            migrationBuilder.DropColumn(
                name: "ScreenshotContentType",
                table: "ELoadingTransactions");

            migrationBuilder.DropColumn(
                name: "ScreenshotUrl",
                table: "ELoadingTransactions");

            migrationBuilder.DropColumn(
                name: "ScreenshotContent",
                table: "BillsPaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ScreenshotContentType",
                table: "BillsPaymentTransactions");

            migrationBuilder.DropColumn(
                name: "ScreenshotUrl",
                table: "BillsPaymentTransactions");
        }
    }
}
