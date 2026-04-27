using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace eTracker.API.Migrations
{
    /// <inheritdoc />
    public partial class AddELoadingBillsPaymentProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BillAmount",
                table: "DeletedTransactions",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillerType",
                table: "DeletedTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ELoadingBaseAmount",
                table: "DeletedTransactions",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ELoadingNetwork",
                table: "DeletedTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ELoadingPhoneNumber",
                table: "DeletedTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BillsPaymentTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    BillerType = table.Column<string>(type: "text", nullable: false),
                    BillAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillsPaymentTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillsPaymentTransactions_Transactions_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ELoadingTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MobileNetwork = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    BaseAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ELoadingTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ELoadingTransactions_Transactions_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    StockCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillsPaymentTransactions_TransactionId",
                table: "BillsPaymentTransactions",
                column: "TransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ELoadingTransactions_TransactionId",
                table: "ELoadingTransactions",
                column: "TransactionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillsPaymentTransactions");

            migrationBuilder.DropTable(
                name: "ELoadingTransactions");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropColumn(
                name: "BillAmount",
                table: "DeletedTransactions");

            migrationBuilder.DropColumn(
                name: "BillerType",
                table: "DeletedTransactions");

            migrationBuilder.DropColumn(
                name: "ELoadingBaseAmount",
                table: "DeletedTransactions");

            migrationBuilder.DropColumn(
                name: "ELoadingNetwork",
                table: "DeletedTransactions");

            migrationBuilder.DropColumn(
                name: "ELoadingPhoneNumber",
                table: "DeletedTransactions");
        }
    }
}
