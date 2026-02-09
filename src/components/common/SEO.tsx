import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../../contexts/BrandingContext';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    url,
    type = 'website'
}) => {
    const { branding } = useBranding();

    const siteTitle = branding.companyName || 'Real Estate Platform';
    const fullTitle = `${title} | ${siteTitle}`;
    const metaDescription = description || branding.heroSubtitle || 'Hệ thống quản lý và kinh doanh bất động sản chuyên nghiệp';
    const metaImage = image || branding.logoUrl || 'https://placehold.co/1200x630/png?text=Real+Estate';
    const metaUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={metaUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
};
