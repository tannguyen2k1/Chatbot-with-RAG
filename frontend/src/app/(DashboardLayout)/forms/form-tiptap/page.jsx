'use client'
import React from 'react';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('@/app/components/forms/form-tiptap/Editor'), {
  ssr: false,
});


const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Tiptap Editor',
  },
];

const TiptapEditor = () => {

  return (
    <PageContainer title="Tiptap Editor " description="this is Tiptap Editor ">
      {/* breadcrumb */}
      <Breadcrumb title="Tiptap Editor " items={BCrumb} />
      {/* end breadcrumb */}
      <Editor />
    </PageContainer>
  );
};

export default TiptapEditor;
