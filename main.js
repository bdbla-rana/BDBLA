// ================== তোমার ইনফরমেশন এখানে দাও ==================
        const GITHUB_USERNAME = "JoyDevnath";      
        const REPO_NAME = "Image-Hosting";         
        const TOKEN = "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"; 
        // ==========================================================

        const DAILY_UPLOAD_LIMIT = 10; 
        const STORAGE_KEY = 'githubUploaderData'; 

        const dropArea = document.getElementById('drop-area');
        const fileInput = document.getElementById('file-input');
        const fileNameDisplay = document.getElementById('file-name');
        const uploadButton = document.getElementById('upload-button');
        const loader = document.getElementById('loader');
        const statusMessage = document.getElementById('status-message');
        const resultBox = document.getElementById('result-box');
        const imageLinkInput = document.getElementById('image-link');
        const copyButton = document.getElementById('copy-button');
        const uploadCounterDisplay = document.getElementById('upload-counter'); 

        let selectedFile = null;

        document.addEventListener('DOMContentLoaded', () => {
            updateUploadCounterUI();
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'), false);
        });

        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        dropArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        function handleFile(file) {
            if (file && file.type.startsWith('image/')) {
                selectedFile = file;
                const fileSize = formatFileSize(file.size);
                fileNameDisplay.textContent = `${file.name} (${fileSize})`;
                uploadButton.disabled = false;
                resetStatus();
            } else {
                alert("Please select an image file (PNG, JPG, etc).");
            }
        }

        uploadButton.addEventListener('click', () => {
            if (selectedFile) {
                uploadImage(selectedFile);
            }
        });

        async function uploadImage(file) {
            
            const uploadData = getUploadData();

            if (uploadData.count >= DAILY_UPLOAD_LIMIT) {
                showError(`আপনি আজ ${DAILY_UPLOAD_LIMIT}টির বেশি ফাইল আপলোড করতে পারবেন না।`);
                return; 
            }
            
            if (uploadData.uploadedFiles.includes(file.name)) {
                showError(`"${file.name}" নামের ফাইলটি আজ একবার আপলোড করা হয়েছে।`);
                return; 
            }

            uploadButton.disabled = true;
            loader.style.display = 'block';
            resetStatus();

            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const base60Content = reader.result.split(',')[1]; 
                const fileName = `images/img_${Date.now()}_${file.name}`; 

                const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${fileName}`;

                try {
                    const response = await fetch(apiUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Uploaded image: ${file.name}`,
                            content: base60Content,
                            committer: {
                                name: GITHUB_USERNAME,
                                email: "uploader@example.com"
                            }
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        const viewLink = data.content.download_url;
                        showSuccess(viewLink);
                    } else {
                        showError(data.message || "Failed to upload file.");
                    }

                } catch (error) {
                    console.error(error);
                    showError("An error occurred. Check the console.");
                } finally {
                    loader.style.display = 'none';
                    uploadButton.disabled = false;
                }
            };

            reader.onerror = () => {
                showError("Failed to read the file.");
                loader.style.display = 'none';
                uploadButton.disabled = false;
            };
        }

        function showSuccess(link) {
            incrementUploadCount(selectedFile.name); 
            
            statusMessage.textContent = 'Upload Successful!';
            statusMessage.className = 'success';
            resultBox.style.display = 'block';
            imageLinkInput.value = link;
        }

        function showError(message) {
            statusMessage.textContent = `Error: ${message}`;
            statusMessage.className = 'error';
            resultBox.style.display = 'none';
        }

        function resetStatus() {
            statusMessage.textContent = '';
            statusMessage.className = '';
            resultBox.style.display = 'none';
            updateUploadCounterUI(); 
        }

        copyButton.addEventListener('click', () => {
            imageLinkInput.select();
            
            try {
                navigator.clipboard.writeText(imageLinkInput.value).then(() => {
                    setCopyButtonText('Copied!');
                }).catch(() => {
                    document.execCommand('copy');
                    setCopyButtonText('Copied!');
                });
            } catch (err) {
                document.execCommand('copy');
                setCopyButtonText('Copied!');
            }
        });

        function setCopyButtonText(text) {
             copyButton.textContent = text;
             setTimeout(() => {
                 copyButton.textContent = 'Copy';
            }, 2000);
        }

        // ==========================================================
        // হেলপার ফাংশন
        // ==========================================================

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function getTodayDateString() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        }

        function getUploadData() {
            const today = getTodayDateString();
            let data;
            try {
                data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { count: 0, date: today, uploadedFiles: [] };
            } catch (e) {
                data = { count: 0, date: today, uploadedFiles: [] };
            }

            if (data.date !== today) {
                data.count = 0;
                data.date = today;
                data.uploadedFiles = []; 
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
            
            if (!data.uploadedFiles) {
                data.uploadedFiles = [];
            }
            
            return data;
        }

        function incrementUploadCount(fileName) {
            const data = getUploadData();
            data.count += 1;
            data.uploadedFiles.push(fileName); 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            updateUploadCounterUI(); 
        }

        function updateUploadCounterUI() {
            const data = getUploadData();
            const remaining = DAILY_UPLOAD_LIMIT - data.count;
            
            if (remaining <= 0) {
                uploadCounterDisplay.textContent = "আজকের জন্য আপনার আপলোড লিমিট শেষ।";
                uploadCounterDisplay.style.color = "#ef4444"; 
            } else {
                uploadCounterDisplay.textContent = `আজকের জন্য ${remaining} টি আপলোড বাকি আছে।`;
                uploadCounterDisplay.style.color = "#6b7280";
            }
        }