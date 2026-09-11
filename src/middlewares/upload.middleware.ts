import multer from "multer";
export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      file.mimetype === "text/csv" ||
        file.originalname.toLowerCase().endsWith(".csv"),
    ),
});
