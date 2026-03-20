const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isLocalStorageAvailable = !process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT;

const storage = isLocalStorageAvailable 
    ? multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = 'uploads/';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    })
    : multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // [최적화] 허용 파일 형식 확장 (한컴 PDF 및 최신 이미지 형식 포함)
    const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/webp', 
        'image/gif', 
        'application/pdf', 
        'application/haansoftpdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`지원하지 않는 파일 형식입니다: ${file.mimetype}. (JPG, PNG, PDF만 가능)`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

module.exports = upload;
