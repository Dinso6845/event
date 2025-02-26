-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 26, 2025 at 03:27 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `event`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `am_id` int(100) NOT NULL,
  `am_user` varchar(50) NOT NULL,
  `am_password` varchar(100) NOT NULL,
  `am_timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`am_id`, `am_user`, `am_password`, `am_timestamp`) VALUES
(1, 'admin', 'adminjjmall', '2025-01-02 08:32:32');

-- --------------------------------------------------------

--
-- Table structure for table `background`
--

CREATE TABLE `background` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `background_path` varchar(255) NOT NULL,
  `type` enum('image','video') NOT NULL DEFAULT 'image',
  `h1` varchar(255) NOT NULL,
  `music` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `background`
--

INSERT INTO `background` (`id`, `name`, `background_path`, `type`, `h1`, `music`) VALUES
(1, '123.mp4', 'C:\\xampp\\htdocs\\Event\\uploads\\che.gif', 'image', 'วันเด็กแห่งชาติ\r\n(children\'s day)', 'C:\\xampp\\htdocs\\Event\\uploads\\1.mp3');

-- --------------------------------------------------------

--
-- Table structure for table `banned_words`
--

CREATE TABLE `banned_words` (
  `id` int(10) NOT NULL,
  `word` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `banned_words`
--

INSERT INTO `banned_words` (`id`, `word`) VALUES
(64, 'กู'),
(65, 'มึง'),
(66, 'เหี้ย'),
(67, 'สัส'),
(68, 'หี'),
(69, 'ไอ้สัส'),
(70, 'ชาติหมา'),
(71, 'ควย'),
(72, 'เย็ด'),
(73, 'ระยำ'),
(74, 'สันดาน'),
(75, 'โง่'),
(76, 'ปัญญาอ่อน'),
(77, 'ไอ้เวร'),
(78, 'ไอ้บ้า'),
(79, 'fuck'),
(80, 'shit'),
(81, 'bitch'),
(82, 'ass'),
(83, 'wtf'),
(84, 'wth'),
(85, 'omfg'),
(86, 'stupid'),
(87, 'idiot');

-- --------------------------------------------------------

--
-- Table structure for table `characters`
--

CREATE TABLE `characters` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `image_name` varchar(255) NOT NULL,
  `image_path` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `characters`
--

INSERT INTO `characters` (`id`, `event_id`, `image_name`, `image_path`) VALUES
(38, 2, '6799de6989a5b_1', 'uploads/67b546d925c38.gif'),
(41, 2, 'pig-418_256', 'uploads/67baa7482178c.gif'),
(42, 2, 'elephant-422_256', 'uploads/67baa74c83edf.gif');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `background_path` varchar(255) DEFAULT NULL,
  `button_color` varchar(50) DEFAULT NULL,
  `text_color` varchar(50) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `text_button` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'inactive',
  `music` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `toptext_color` varchar(50) DEFAULT NULL,
  `sender_color` varchar(50) DEFAULT NULL,
  `set_cartoon` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `name`, `background_path`, `button_color`, `text_color`, `message`, `text_button`, `status`, `music`, `created_at`, `updated_at`, `toptext_color`, `sender_color`, `set_cartoon`) VALUES
(2, 'วันอวกาศ', 'uploads/67baa37fa594d_background.mp4', '#ff0000', '#001eff', 'http://127.0.0.1:5000/', 'กด กด ไป เถอะ', 'active', 'uploads/67b592de390d6_music.mp3', '2025-02-14 09:16:24', '2025-02-26 02:08:27', '#2bff00', '#00eeff', '5'),
(6, 'วันพระ', '', '#000000', '#000000', NULL, NULL, 'inactive', NULL, '2025-02-19 08:07:35', '2025-02-23 10:52:16', '#000000', '#000000', ''),
(9, 'วันไรคับเนี้ย', NULL, NULL, NULL, NULL, NULL, 'inactive', NULL, '2025-02-23 03:21:57', '2025-02-23 03:21:57', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `face_images`
--

CREATE TABLE `face_images` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `faceImagePath` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `face_images`
--

INSERT INTO `face_images` (`id`, `name`, `faceImagePath`) VALUES
(1, 'image4.png', 'C:\\Event\\uploads\\image4.png');

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `id` int(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image_path` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `name`, `image_path`) VALUES
(1, '3.gif', 'C:\\xampp\\htdocs\\Event\\uploads\\GIF วันเด็ก\\3.gif'),
(2, '5.gif', 'C:\\xampp\\htdocs\\Event\\uploads\\GIF วันเด็ก\\5.gif'),
(3, '1.gif', 'C:\\xampp\\htdocs\\Event\\uploads\\GIF วันเด็ก\\1.gif'),
(4, '2.gif', 'C:\\xampp\\htdocs\\Event\\uploads\\GIF วันเด็ก\\2.gif'),
(5, '4.gif', 'C:\\xampp\\htdocs\\Event\\uploads\\GIF วันเด็ก\\4.gif'),
(6, '6.gif', 'C:\\xampp\\htdocs\\Event\\uploads\\GIF วันเด็ก\\6.gif');

-- --------------------------------------------------------

--
-- Table structure for table `savecartoon`
--

CREATE TABLE `savecartoon` (
  `id` int(20) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `user_message` varchar(255) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `event_name` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `savecartoon`
--

INSERT INTO `savecartoon` (`id`, `image`, `user_message`, `message`, `event_name`, `sort_order`) VALUES
(8, 'http://127.0.0.1/Event/uploads/67b546d925c38.gif', '1', '1', 'วันอวกาศ', 2),
(9, 'http://127.0.0.1/Event/uploads/67b546d925c38.gif', '3', '3', 'วันอวกาศ', 3),
(10, 'http://127.0.0.1/Event/uploads/67b546d925c38.gif', '4', '4', 'วันอวกาศ', 4),
(11, 'http://127.0.0.1/Event/uploads/67b546d925c38.gif', '5', '5', 'วันอวกาศ', 5),
(12, 'http://127.0.0.1/Event/uploads/67b546d925c38.gif', '6', '6', 'วันอวกาศ', 6),
(13, 'http://127.0.0.1/Event/uploads/67b546d925c38.gif', '7', '7', 'วันอวกาศ', 7),
(14, 'uploads/1740120422_1740106714_image4.png', '8', '8', 'วันอวกาศ', 8),
(15, 'uploads/1740120607_bloggif_6781d961ba2ce.gif', 'พี่ปาง', '9', 'วันอวกาศ', 9),
(16, 'http://127.0.0.1/Event/uploads/67ba91f6976db.png', 'พี่มาแล้วน้อง', '55555', 'วันพระนะจ๊ะ', 0),
(17, 'http://127.0.0.1/Event/uploads/67baa7482178c.gif', 'หมูน้อย', 'ขอข้าวกินหน่อยย', 'วันอวกาศ', 0),
(18, 'http://127.0.0.1/Event/uploads/67baa74c83edf.gif', 'ช้างน้อย', 'พิซซ่ามาส่งแล้วค้าบบ', 'วันอวกาศ', 0),
(19, 'http://127.0.0.1/Event/uploads/67baa7482178c.gif', 'รวย', 'รวยเอ้ย', 'วันอวกาศ', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`am_id`);

--
-- Indexes for table `background`
--
ALTER TABLE `background`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `banned_words`
--
ALTER TABLE `banned_words`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `characters`
--
ALTER TABLE `characters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `face_images`
--
ALTER TABLE `face_images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `savecartoon`
--
ALTER TABLE `savecartoon`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `am_id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `background`
--
ALTER TABLE `background`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `banned_words`
--
ALTER TABLE `banned_words`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `characters`
--
ALTER TABLE `characters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `face_images`
--
ALTER TABLE `face_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `savecartoon`
--
ALTER TABLE `savecartoon`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `characters`
--
ALTER TABLE `characters`
  ADD CONSTRAINT `characters_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
