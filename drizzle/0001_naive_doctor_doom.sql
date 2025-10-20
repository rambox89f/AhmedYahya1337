CREATE TABLE `images` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`prompt` text NOT NULL,
	`imageUrl` text NOT NULL,
	`originalImageUrl` text,
	`type` enum('generate','edit') NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
