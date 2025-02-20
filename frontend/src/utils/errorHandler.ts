export const handleApiError = (error: any) => {
  if (error.response) {
    // 服务器响应错误
    return error.response.data.message || 'Server error occurred';
  } else if (error.request) {
    // 请求未收到响应
    return 'No response from server';
  } else {
    // 请求配置错误
    return 'Request failed';
  }
}; 