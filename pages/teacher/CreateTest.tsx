import React from 'react';
import TestEditor from './TestEditor';

const CreateTest: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Tạo bài thi mới</h1>
      <TestEditor />
    </div>
  );
};

export default CreateTest;
