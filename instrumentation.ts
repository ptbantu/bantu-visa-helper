export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeBackgroundServices } = await import('@/src/lib/background-services');
    console.log('应用启动，初始化后台服务...');
    initializeBackgroundServices();
  }
}
