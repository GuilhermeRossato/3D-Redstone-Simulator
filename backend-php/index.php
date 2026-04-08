<?php

echo "This file is not meant to be executed directly.";
echo "<script>";
echo "fetch('/3D-Redstone-Simulator/backend-php/static/index.txt')
  .then(response => {
    if (!response.ok) {
      console.error('Failed to fetch file. Status:', response.status);
      return;
    }
    return response.text();
  })
  .then(data => {
    console.log('File content:', data);
  })
  .catch(error => {
    console.error('Error during fetch operation:', error);
  });";
echo "</script>";