'use client';

import React, { useState, useRef } from 'react';

import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CSVUploadZoneProps {
  onUploadSuccess: (
    columns: string[],
    filename: string,
    preview: any[]
  ) => void;
}

export default function CSVUploadZone({
  onUploadSuccess,
}: CSVUploadZoneProps) {

  const [isDragging, setIsDragging] =
    useState(false);

  const [status, setStatus] = useState<{
    type:
      | 'idle'
      | 'loading'
      | 'success'
      | 'error';

    message: string;
  }>({
    type: 'idle',
    message: '',
  });

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const handleUpload = async (
    file: File
  ) => {

    const filename =
      file.name.toLowerCase();

    if (
      !filename.endsWith('.csv') &&
      !filename.endsWith('.xlsx')
    ) {

      setStatus({
        type: 'error',
        message:
          'Please upload a valid CSV or XLSX file.',
      });

      return;
    }

    setStatus({
      type: 'loading',
      message:
        'Uploading and processing dataset...',
    });

    const formData = new FormData();

    formData.append('file', file);

    try {

      const res = await fetch(
        'http://localhost:8000/api/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error(
          'Upload failed.'
        );
      }

      const data = await res.json();

      setStatus({
        type: 'success',
        message:
          `Loaded ${data.filename} (${data.rows} rows)`,
      });

      onUploadSuccess(
        data.columns,
        data.filename,
        data.preview
      );

    } catch (err) {

      setStatus({
        type: 'error',
        message:
          'Failed to upload dataset.',
      });
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (file) {
      handleUpload(file);
    }
  };

  return (

    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}

      onDragLeave={() =>
        setIsDragging(false)
      }

      onDrop={(e) => {

        e.preventDefault();

        setIsDragging(false);

        if (
          e.dataTransfer.files?.[0]
        ) {
          handleUpload(
            e.dataTransfer.files[0]
          );
        }
      }}

      onClick={() =>
        fileInputRef.current?.click()
      }

      className={`
        relative
        w-full
        rounded-2xl
        border
        transition-all
        duration-200
        cursor-pointer
        bg-white
        dark:bg-zinc-950
        ${
          isDragging
            ? 'border-zinc-400 dark:border-zinc-600'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }
      `}
    >

      {/* INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="
          .csv,
          .xlsx,
          application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        "
        onChange={handleFileChange}
      />

      {/* IDLE */}
      {status.type === 'idle' && (

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            px-8
            py-12
            text-center
          "
        >

          <div
            className="
              flex
              items-center
              justify-center
              h-14
              w-14
              rounded-xl
              bg-zinc-100
              dark:bg-zinc-900
              border
              border-zinc-200
              dark:border-zinc-800
              mb-5
            "
          >
            <UploadCloud
              className="
                h-6
                w-6
                text-zinc-600
                dark:text-zinc-300
              "
            />
          </div>

          <h3
            className="
              text-base
              font-semibold
              text-zinc-900
              dark:text-zinc-100
            "
          >
            Upload Dataset
          </h3>

          <p
            className="
              mt-2
              max-w-md
              text-sm
              leading-relaxed
              text-zinc-500
              dark:text-zinc-400
            "
          >
            Drag and drop your CSV or Excel
            file here, or click to browse.
          </p>

          <div
            className="
              mt-5
              flex
              items-center
              gap-2
              flex-wrap
              justify-center
            "
          >

            <span
              className="
                rounded-full
                border
                border-zinc-200
                dark:border-zinc-800
                px-3
                py-1
                text-xs
                text-zinc-500
                dark:text-zinc-400
              "
            >
              CSV
            </span>

            <span
              className="
                rounded-full
                border
                border-zinc-200
                dark:border-zinc-800
                px-3
                py-1
                text-xs
                text-zinc-500
                dark:text-zinc-400
              "
            >
              XLSX
            </span>
          </div>
        </div>
      )}

      {/* LOADING */}
      {status.type === 'loading' && (

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            px-8
            py-14
            text-center
          "
        >

          <div
            className="
              h-10
              w-10
              rounded-full
              border-2
              border-zinc-300
              dark:border-zinc-700
              border-t-zinc-900
              dark:border-t-white
              animate-spin
            "
          />

          <h3
            className="
              mt-5
              text-base
              font-semibold
              text-zinc-900
              dark:text-zinc-100
            "
          >
            Processing Dataset
          </h3>

          <p
            className="
              mt-2
              text-sm
              text-zinc-500
              dark:text-zinc-400
            "
          >
            {status.message}
          </p>
        </div>
      )}

      {/* SUCCESS */}
      {status.type === 'success' && (

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            px-8
            py-14
            text-center
          "
        >

          <div
            className="
              flex
              items-center
              justify-center
              h-14
              w-14
              rounded-full
              bg-emerald-50
              dark:bg-emerald-500/10
              border
              border-emerald-200
              dark:border-emerald-500/20
            "
          >
            <CheckCircle2
              className="
                h-7
                w-7
                text-emerald-600
                dark:text-emerald-400
              "
            />
          </div>

          <h3
            className="
              mt-5
              text-base
              font-semibold
              text-zinc-900
              dark:text-zinc-100
            "
          >
            Dataset Uploaded
          </h3>

          <p
            className="
              mt-2
              text-sm
              text-zinc-500
              dark:text-zinc-400
            "
          >
            {status.message}
          </p>
        </div>
      )}

      {/* ERROR */}
      {status.type === 'error' && (

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            px-8
            py-14
            text-center
          "
        >

          <div
            className="
              flex
              items-center
              justify-center
              h-14
              w-14
              rounded-full
              bg-rose-50
              dark:bg-rose-500/10
              border
              border-rose-200
              dark:border-rose-500/20
            "
          >
            <AlertCircle
              className="
                h-7
                w-7
                text-rose-600
                dark:text-rose-400
              "
            />
          </div>

          <h3
            className="
              mt-5
              text-base
              font-semibold
              text-zinc-900
              dark:text-zinc-100
            "
          >
            Upload Failed
          </h3>

          <p
            className="
              mt-2
              text-sm
              text-rose-500
            "
          >
            {status.message}
          </p>

          <p
            className="
              mt-2
              text-xs
              text-zinc-500
              dark:text-zinc-400
            "
          >
            Click to try again
          </p>
        </div>
      )}
    </div>
  );
}