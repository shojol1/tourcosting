-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 02, 2026 at 10:49 PM
-- Server version: 10.11.18-MariaDB-cll-lve
-- PHP Version: 8.4.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shojolwo_photodb`
--

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `trip_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `trips`
--

INSERT INTO `trips` (`id`, `name`, `trip_date`, `created_at`) VALUES
(7, 'à¦¶à§à¦°à§€à¦®à¦™à§à¦—à¦²', '2025-06-10', '2025-06-10 17:46:19'),
(8, 'Cox Bazar', '2025-08-20', '2025-08-14 07:17:58'),
(9, 'Mirinja Valley, Bandarban', '2025-09-30', '2025-09-30 11:43:54'),
(10, 'Saintmartine', '2025-12-24', '2025-11-16 07:12:46'),
(11, 'Sajek Valley', '2026-03-25', '2026-03-09 07:21:41'),
(12, 'Coxâ€™s Bazar', '2026-04-29', '2026-04-29 16:54:18'),
(13, 'Coxâ€™s Bazar, Mirinja', '2026-08-25', '2026-07-09 11:37:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
