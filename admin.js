document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN LOGIC ---
    const users = [
        { username: 'admin', password: 'password123' },
        { username: 'editor1', password: 'password456' },
        { username: 'editor2', password: 'password789' },
        { username: 'user1', password: 'password101' },
        { username: 'user2', password: 'password112' }
    ];

    const loginContainer = document.getElementById('login-container');
    const adminWrapper = document.getElementById('admin-wrapper');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const foundUser = users.find(user => user.username === username && user.password === password);

        if (foundUser) {
            loginContainer.style.display = 'none';
            adminWrapper.style.display = 'block';
            initializeAdminPanel();
        } else {
            loginError.textContent = 'Invalid username or password.';
            setTimeout(() => { loginError.textContent = ''; }, 3000);
        }
    });

    // --- ADMIN PANEL LOGIC (run after successful login) ---
    function initializeAdminPanel() {
        const editor = document.getElementById('post-content');
        const toolbar = document.querySelector('.editor-toolbar');
        const form = document.getElementById('post-form');
        const imageUploadInput = document.getElementById('image-upload-input');
        const insertImageBtn = document.getElementById('insert-image-btn');
        const postTypeSelect = document.getElementById('post-type');
        const videoFields = document.getElementById('video-fields');
        const contentFields = document.getElementById('content-fields');
        const thumbnailLabel = document.getElementById('thumbnail-label');
        const publishBtn = document.getElementById('publish-btn');
        const postIdInput = document.getElementById('post-id');
        const editorHeading = document.querySelector('.editor-container h1');
    
        // Content list table bodies
        const articleList = document.getElementById('article-list');
        const newsList = document.getElementById('news-list');
        const videoList = document.getElementById('video-list');
        
        // Confirmation Modal elements
        const confirmModal = document.getElementById('confirm-modal');
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        let itemToDeleteId = null;
    
        // --- RENDER CONTENT LIST ---
        function renderContentList() {
            const mediaContent = JSON.parse(localStorage.getItem('mediaContent')) || [];
            
            const articles = mediaContent.filter(item => item.type === 'article');
            const news = mediaContent.filter(item => item.type === 'news');
            const videos = mediaContent.filter(item => item.type === 'video');
    
            populateTable(articleList, articles);
            populateTable(newsList, news);
            populateTable(videoList, videos);
        }
    
        function populateTable(tbody, items) {
            tbody.innerHTML = ''; // Clear the table body
            const columns = tbody.parentElement.tHead.rows[0].cells.length;
    
            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns}" style="text-align:center; padding: 20px;">No content in this category.</td></tr>`;
                return;
            }
    
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img src="${item.thumbnailUrl}" alt="Thumbnail" class="list-thumbnail" onerror="this.onerror=null;this.src='https://placehold.co/80x50/cccccc/ffffff?text=No+Img';"></td>
                    <td class="title-cell">${item.title}</td>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td class="actions-cell">
                        <button class="action-btn edit-btn" data-id="${item.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn delete-btn" data-id="${item.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    
        // --- HANDLE CONTENT ACTIONS (EDIT/DELETE) ---
        document.querySelector('.content-management-container').addEventListener('click', (e) => {
            const target = e.target.closest('.action-btn');
            if (!target) return;
    
            const id = target.dataset.id;
            if (target.classList.contains('edit-btn')) {
                editPost(id);
            } else if (target.classList.contains('delete-btn')) {
                showDeleteConfirmation(id);
            }
        });
    
        // --- DELETE CONFIRMATION LOGIC ---
        function showDeleteConfirmation(id) {
            itemToDeleteId = id;
            confirmModal.classList.add('active');
        }
    
        function hideDeleteConfirmation() {
            itemToDeleteId = null;
            confirmModal.classList.remove('active');
        }
    
        function deletePost() {
            if (!itemToDeleteId) return;
            let mediaContent = JSON.parse(localStorage.getItem('mediaContent')) || [];
            mediaContent = mediaContent.filter(item => item.id !== itemToDeleteId);
            localStorage.setItem('mediaContent', JSON.stringify(mediaContent));
            renderContentList();
            hideDeleteConfirmation();
        }
        
        confirmDeleteBtn.addEventListener('click', deletePost);
        cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) hideDeleteConfirmation();
        });
    
        // --- CLEAR FORM & RESET TO CREATE MODE ---
        function clearForm() {
            form.reset();
            editor.innerHTML = '';
            postIdInput.value = '';
            document.querySelectorAll('.image-preview').forEach(p => {
                p.src = '';
                p.style.display = 'none';
            });
            postTypeSelect.dispatchEvent(new Event('change'));
            editorHeading.textContent = 'Create New Post';
            publishBtn.textContent = 'Publish Content';
            publishBtn.disabled = false;
        }
    
        // --- POPULATE FORM FOR EDITING ---
        function editPost(id) {
            const mediaContent = JSON.parse(localStorage.getItem('mediaContent')) || [];
            const postToEdit = mediaContent.find(item => item.id === id);
            if (!postToEdit) return;
    
            window.scrollTo({ top: 0, behavior: 'smooth' });
            editorHeading.textContent = 'Edit Post';
            publishBtn.textContent = 'Update Content';
    
            postIdInput.value = postToEdit.id;
            document.getElementById('post-title').value = postToEdit.title;
            postTypeSelect.value = postToEdit.type;
            postTypeSelect.dispatchEvent(new Event('change'));
    
            if (postToEdit.type === 'video') {
                document.getElementById('post-video-url').value = postToEdit.videoUrl || '';
            } else {
                document.getElementById('post-author').value = postToEdit.meta || '';
                editor.innerHTML = postToEdit.content || '';
            }
    
            const setupImageField = (fieldName, imageUrl) => {
                const preview = document.getElementById(`${fieldName}-preview`);
                const urlInput = document.getElementById(`post-${fieldName}-url`);
                const uploadInput = document.getElementById(`post-${fieldName}-upload`);
                const urlRadio = document.querySelector(`input[name="${fieldName}-source"][value="url"]`);
                const uploadRadio = document.querySelector(`input[name="${fieldName}-source"][value="upload"]`);
                
                if (imageUrl) {
                     if (imageUrl.startsWith('data:image')) {
                        uploadRadio.checked = true;
                        urlInput.style.display = 'none';
                        uploadInput.style.display = 'block';
                    } else {
                        urlRadio.checked = true;
                        urlInput.style.display = 'block';
                        uploadInput.style.display = 'none';
                        urlInput.value = imageUrl;
                    }
                    preview.src = imageUrl;
                    preview.style.display = 'block';
                }
            };
    
            setupImageField('thumbnail', postToEdit.thumbnailUrl);
            if (postToEdit.type !== 'video') {
                setupImageField('main-image', postToEdit.mainImageUrl);
            }
        }
        
        renderContentList();
    
        // --- DYNAMIC FORM LOGIC ---
        postTypeSelect.addEventListener('change', () => {
            if (postTypeSelect.value === 'video') {
                videoFields.style.display = 'block';
                contentFields.style.display = 'none';
                thumbnailLabel.textContent = 'Thumbnail Image (Optional)';
            } else {
                videoFields.style.display = 'none';
                contentFields.style.display = 'block';
                thumbnailLabel.textContent = 'Thumbnail Image';
            }
        });
    
        // --- IMAGE UPLOADER UI LOGIC ---
        function setupImageUploader(groupName) {
            const urlRadio = document.querySelector(`input[name="${groupName}-source"][value="url"]`);
            const uploadRadio = document.querySelector(`input[name="${groupName}-source"][value="upload"]`);
            const urlInput = document.getElementById(`post-${groupName}-url`);
            const uploadInput = document.getElementById(`post-${groupName}-upload`);
            const preview = document.getElementById(`${groupName}-preview`);
    
            urlRadio.addEventListener('change', () => {
                urlInput.style.display = 'block';
                uploadInput.style.display = 'none';
            });
    
            uploadRadio.addEventListener('change', () => {
                urlInput.style.display = 'none';
                uploadInput.style.display = 'block';
            });
    
            const handleImage = (file) => {
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            urlInput.addEventListener('input', () => {
                 if(urlInput.value) {
                    preview.src = urlInput.value;
                    preview.style.display = 'block';
                 } else {
                    preview.style.display = 'none';
                 }
            });
            uploadInput.addEventListener('change', () => handleImage(uploadInput.files[0]));
        }
    
        setupImageUploader('thumbnail');
        setupImageUploader('main-image');
    
        // --- TOOLBAR FUNCTIONALITY ---
        toolbar.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target || target.id === 'insert-image-btn' || target.tagName === 'SELECT') return;
            const command = target.dataset.command;
            let value = null;
            if (command === 'createLink') {
                value = prompt('Enter the URL:');
                if (!value || value === 'null') return;
            }
            document.execCommand(command, false, value);
            editor.focus();
        });
        
        insertImageBtn.addEventListener('click', () => imageUploadInput.click());
    
        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.execCommand('insertImage', false, event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    
        // --- FORM SUBMISSION (CREATE & UPDATE) ---
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            publishBtn.textContent = postIdInput.value ? 'Updating...' : 'Publishing...';
            publishBtn.disabled = true;
    
            try {
                const getImageData = async (groupName) => {
                    const source = document.querySelector(`input[name="${groupName}-source"]:checked`).value;
                    const urlInput = document.getElementById(`post-${groupName}-url`);
                    const uploadInput = document.getElementById(`post-${groupName}-upload`);
                    
                    if (source === 'url') return urlInput.value;
                    const file = uploadInput.files[0];
                    if (!file) return null;
    
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                };
    
                const type = postTypeSelect.value;
                const title = document.getElementById('post-title').value;
                let postData = { id: postIdInput.value || `${type}-${Date.now()}`, type, title, date: new Date().toISOString() };
    
                if (type === 'video') {
                    const videoUrl = document.getElementById('post-video-url').value;
                    if (!videoUrl) throw new Error('YouTube video URL is required.');
    
                    let thumbnailUrl = await getImageData('thumbnail');
                    if (!thumbnailUrl) {
                         const mediaContent = JSON.parse(localStorage.getItem('mediaContent')) || [];
                         const existingPost = mediaContent.find(item => item.id === postData.id);
                         if(existingPost && existingPost.thumbnailUrl) {
                             thumbnailUrl = existingPost.thumbnailUrl;
                         } else {
                            const videoId = (videoUrl.match(/[?&]v=([^&]+)/) || [])[1];
                            if (videoId) thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            else throw new Error('Invalid YouTube URL for thumbnail generation.');
                         }
                    }
                    postData = { ...postData, videoUrl: videoUrl, thumbnailUrl: thumbnailUrl, description: `A video titled "${title}".` };
                } else {
                    let thumbnailUrl = await getImageData('thumbnail');
                    let mainImageUrl = await getImageData('main-image');
    
                    if (postIdInput.value) { // In edit mode, preserve old images if new ones aren't provided
                        const mediaContent = JSON.parse(localStorage.getItem('mediaContent')) || [];
                        const existingPost = mediaContent.find(item => item.id === postData.id);
                        if (existingPost) { // Check if post exists before accessing properties
                            if (!thumbnailUrl) thumbnailUrl = existingPost.thumbnailUrl;
                            if (!mainImageUrl) mainImageUrl = existingPost.mainImageUrl;
                        }
                    }
    
                    if (!thumbnailUrl) throw new Error('A thumbnail image is required.');
                    
                    postData = {
                        ...postData,
                        thumbnailUrl: thumbnailUrl,
                        mainImageUrl: mainImageUrl || thumbnailUrl,
                        meta: document.getElementById('post-author').value,
                        content: editor.innerHTML,
                        description: editor.innerText.substring(0, 120) + '...',
                    };
                }
    
                let mediaContent = JSON.parse(localStorage.getItem('mediaContent')) || [];
                const existingPostIndex = mediaContent.findIndex(item => item.id === postData.id);
    
                if (existingPostIndex > -1) {
                    mediaContent[existingPostIndex] = postData; // Update existing
                } else {
                    mediaContent.unshift(postData); // Add new
                }
                localStorage.setItem('mediaContent', JSON.stringify(mediaContent));
    
                clearForm();
                renderContentList();
    
            } catch (error) {
                console.error('Publishing Error:', error);
                publishBtn.textContent = postIdInput.value ? 'Update Content' : 'Publish Content';
                publishBtn.disabled = false;
            }
        });
    
        // --- IMAGE RESIZING IN EDITOR ---
        let selectedImageForResize = null;
        let resizeHandle;
    
        const clearImageSelection = () => {
            if (selectedImageForResize) {
                selectedImageForResize.classList.remove('resizable-image-selected');
            }
            if (resizeHandle) {
                resizeHandle.remove();
                resizeHandle = null;
            }
            selectedImageForResize = null;
        };
    
        const createResizeHandle = (img) => {
            if (resizeHandle) resizeHandle.remove();
            resizeHandle = document.createElement('div');
            resizeHandle.classList.add('image-resize-handle');
            editor.appendChild(resizeHandle);
            positionResizeHandle(img);
            resizeHandle.addEventListener('mousedown', initResize, false);
        };
    
        const positionResizeHandle = (img) => {
            if (!resizeHandle || !img) return;
            resizeHandle.style.top = `${img.offsetTop + img.offsetHeight - 8}px`;
            resizeHandle.style.left = `${img.offsetLeft + img.offsetWidth - 8}px`;
        };
    
        editor.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'IMG') {
                e.stopPropagation();
                if (selectedImageForResize && selectedImageForResize !== e.target) {
                    clearImageSelection();
                }
                selectedImageForResize = e.target;
                selectedImageForResize.classList.add('resizable-image-selected');
                createResizeHandle(selectedImageForResize);
            } else if (!e.target.classList.contains('image-resize-handle')) {
                clearImageSelection();
            }
        });
    
        let startX, startY, startWidth;
    
        function initResize(e) {
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = selectedImageForResize.offsetWidth;
            document.documentElement.addEventListener('mousemove', doResize, false);
            document.documentElement.addEventListener('mouseup', stopResize, false);
        }
    
        function doResize(e) {
            if (!selectedImageForResize) return;
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth > 50) {
                selectedImageForResize.style.width = `${newWidth}px`;
                selectedImageForResize.style.height = 'auto';
                positionResizeHandle(selectedImageForResize);
            }
        }
    
        function stopResize() {
            document.documentElement.removeEventListener('mousemove', doResize, false);
            document.documentElement.removeEventListener('mouseup', stopResize, false);
        }
    }
});

