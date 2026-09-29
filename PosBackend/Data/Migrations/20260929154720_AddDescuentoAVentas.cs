using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosBackend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDescuentoAVentas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Descuento",
                table: "ventas",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "MotivoDescuento",
                table: "ventas",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalBruto",
                table: "ventas",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("UPDATE ventas SET \"TotalBruto\" = \"Total\" WHERE \"TotalBruto\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Descuento",
                table: "ventas");

            migrationBuilder.DropColumn(
                name: "MotivoDescuento",
                table: "ventas");

            migrationBuilder.DropColumn(
                name: "TotalBruto",
                table: "ventas");
        }
    }
}
