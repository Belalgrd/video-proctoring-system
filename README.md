<div align="center">

# 🎥 AI-Powered Video Proctoring System

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TensorFlow.js-4.10.0-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow.js" />
  <img src="https://img.shields.io/badge/Socket.io-4.7-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

<h3 align="center">Real-time AI-based interview integrity monitoring with advanced face detection, object recognition, and behavioral analysis</h3>

<p align="center">
  <a href="https://video-proctoring-system-kappa.vercel.app">View Demo</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#api-documentation">API Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square&logo=checkmarx&logoColor=white" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=flat-square" alt="Contributions Welcome" />
</p>

</div>

---

## 🌟 Overview

The **AI-Powered Video Proctoring System** is a cutting-edge solution designed to ensure integrity during online interviews and assessments. Using advanced computer vision and machine learning technologies, it provides real-time monitoring and comprehensive reporting to maintain examination authenticity.

## ✨ Features

### 🔍 Advanced Detection Capabilities

- **👤 Real-time Face Detection**
  - Continuous face presence monitoring
  - Multiple face detection alerts
  - Head pose and gaze tracking
  - Face recognition for identity verification

- **📱 Object Detection**
  - Mobile phone detection
  - Book and notes detection
  - Electronic devices identification
  - Unauthorized material alerts

- **😴 Behavioral Analysis**
  - Drowsiness and fatigue detection
  - Look-away duration tracking
  - Eye closure monitoring
  - Attention span analysis

- **🔊 Audio Analysis**
  - Background noise detection
  - Multiple voice detection
  - Suspicious sound alerts

### 💻 Technical Features

- **⚡ Real-time Processing**
  - WebRTC video streaming
  - Socket.io bidirectional communication
  - 10+ FPS detection rate
  - Low latency alerts

- **📊 Comprehensive Reporting**
  - PDF report generation
  - Detailed event timeline
  - Integrity score calculation
  - Visual analytics dashboard

- **🔐 Security & Privacy**
  - End-to-end encryption
  - CORS protection
  - Rate limiting
  - Secure WebSocket connections

## 🛠️ Tech Stack

<table>
<tr>
<td>

### Frontend
- **React.js 18.2** - UI Framework
- **TensorFlow.js** - ML Models
- **MediaPipe** - Face Detection
- **Socket.io Client** - Real-time Communication
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **jsPDF** - Report Generation

</td>
<td>

### Backend
- **Node.js & Express** - Server Framework
- **MongoDB** - Database
- **Socket.io** - WebSocket Server
- **Mongoose** - ODM
- **Helmet** - Security
- **Morgan** - Logging
- **Rate Limiter** - API Protection

</td>
</tr>
</table>

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.4 or higher)
- **Git**
- **Webcam** (for testing)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Belalgrd/video-proctoring-system.git
cd video-proctoring-system
