using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IZONE.API.Controllers;
using IZONE.Core.Interfaces;
using IZONE.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace IZONE.Tests.ApiTests
{
    public class TaiKhoanControllerTests
    {
        private readonly Mock<ITaiKhoanRepository> _mockRepo;
        private readonly TaiKhoanController _controller;

        public TaiKhoanControllerTests()
        {
            _mockRepo = new Mock<ITaiKhoanRepository>();
            _controller = new TaiKhoanController(_mockRepo.Object);
        }

        [Fact]
        public async Task GetAllTaiKhoan_ReturnsOkResult_WithListOfTaiKhoan()
        {
            // Arrange
            var taiKhoans = new List<TaiKhoan>
            {
                new TaiKhoan { MaTK = "TK001", TenDangNhap = "admin", MatKhau = "password", LoaiTK = "Admin" },
                new TaiKhoan { MaTK = "TK002", TenDangNhap = "user1", MatKhau = "password", LoaiTK = "HocVien" }
            };
            _mockRepo.Setup(repo => repo.GetAllAsync()).ReturnsAsync(taiKhoans);

            // Act
            var result = await _controller.GetAllTaiKhoan();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<TaiKhoan>>(okResult.Value);
            Assert.Equal(2, returnValue.Count);
        }

        [Fact]
        public async Task GetTaiKhoanById_ReturnsOkResult_WithTaiKhoan()
        {
            // Arrange
            var taiKhoan = new TaiKhoan { MaTK = "TK001", TenDangNhap = "admin", MatKhau = "password", LoaiTK = "Admin" };
            _mockRepo.Setup(repo => repo.GetByIdAsync("TK001")).ReturnsAsync(taiKhoan);

            // Act
            var result = await _controller.GetTaiKhoanById("TK001");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<TaiKhoan>(okResult.Value);
            Assert.Equal("TK001", returnValue.MaTK);
        }

        [Fact]
        public async Task GetTaiKhoanById_ReturnsNotFound_WhenTaiKhoanDoesNotExist()
        {
            // Arrange
            _mockRepo.Setup(repo => repo.GetByIdAsync("TK999")).ReturnsAsync((TaiKhoan)null);

            // Act
            var result = await _controller.GetTaiKhoanById("TK999");

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task Login_ReturnsOkResult_WithTaiKhoan_WhenCredentialsAreValid()
        {
            // Arrange
            var loginModel = new { username = "admin", password = "password" };
            var taiKhoan = new TaiKhoan { MaTK = "TK001", TenDangNhap = "admin", MatKhau = "password", LoaiTK = "Admin" };
            _mockRepo.Setup(repo => repo.CheckLoginAsync("admin", "password")).ReturnsAsync(taiKhoan);

            // Act
            var result = await _controller.Login(loginModel);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<TaiKhoan>(okResult.Value);
            Assert.Equal("admin", returnValue.TenDangNhap);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenCredentialsAreInvalid()
        {
            // Arrange
            var loginModel = new { username = "admin", password = "wrongpassword" };
            _mockRepo.Setup(repo => repo.CheckLoginAsync("admin", "wrongpassword")).ReturnsAsync((TaiKhoan)null);

            // Act
            var result = await _controller.Login(loginModel);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result.Result);
        }

        [Fact]
        public async Task CreateTaiKhoan_ReturnsCreatedAtAction_WithNewTaiKhoan()
        {
            // Arrange
            var newTaiKhoan = new TaiKhoan { MaTK = "TK003", TenDangNhap = "newuser", MatKhau = "password", LoaiTK = "HocVien" };
            _mockRepo.Setup(repo => repo.AddAsync(It.IsAny<TaiKhoan>())).Returns(Task.CompletedTask);

            // Act
            var result = await _controller.CreateTaiKhoan(newTaiKhoan);

            // Assert
            var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returnValue = Assert.IsType<TaiKhoan>(createdAtActionResult.Value);
            Assert.Equal("newuser", returnValue.TenDangNhap);
        }
    }
}