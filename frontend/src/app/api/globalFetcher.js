// SWR fetcher function


const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_API_BASE_URL || '';
    }
    return process.env.NEXT_PUBLIC_API_BASE_URL || '';
};

const buildUrl = (url) => {
    // Nếu url bắt đầu bằng /api/ thì prepend baseUrl, ngược lại giữ nguyên (cho static, nội bộ)
    if (url.startsWith('/api/')) {
        return getBaseUrl() + url;
    }
    return url;
};

const getFetcher = (url, options = {}) => fetch(buildUrl(url), {
    method: "GET",
    headers: { 'browserrefreshed': 'false', ...(options.headers || {}) },
    ...options
}).then((res) => {
    if (!res.ok) {
        throw new Error("Failed to fetch the data")
    }
    return res.json()
});


const postFetcher = (url, arg, options = {}) => fetch(buildUrl(url), {
    method: "POST",
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(arg),
    ...options
}).then((res) => {
    if (!res.ok) {
        throw new Error("Failed to post data")
    }
    return res.json()
});

const putFetcher = (url, arg, options = {}) => fetch(buildUrl(url), {
    method: "PUT",
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(arg),
    ...options
}).then((res) => {
    if (!res.ok) {
        throw new Error("Failed to updated data")
    }
    return res.json()
});

const patchFetcher = (url, arg, options = {}) => fetch(buildUrl(url), {
    method: "PATCH",
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(arg),
    ...options
}).then((res) => {
    if (!res.ok) {
        throw new Error("Failed to updated data")
    }
    return res.json()
});

const deleteFetcher = (url, arg, options = {}) => fetch(buildUrl(url), {
    method: "DELETE",
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(arg),
    ...options
}).then((res) => {
    if (!res.ok) {
        throw new Error("Failed to delete data")
    }
    return res.json()
})

export { getFetcher, postFetcher, putFetcher, deleteFetcher, patchFetcher }