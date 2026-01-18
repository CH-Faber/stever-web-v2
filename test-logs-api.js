// 测试日志 API 的简单脚本
const API_BASE = 'http://localhost:3001';

async function testLogsAPI() {
  console.log('测试日志 API...\n');

  try {
    // 1. 获取所有会话
    console.log('1. 获取所有日志会话...');
    const sessionsRes = await fetch(`${API_BASE}/api/logs/sessions`);
    const sessionsData = await sessionsRes.json();
    console.log(`   找到 ${sessionsData.sessions.length} 个会话`);
    
    if (sessionsData.sessions.length > 0) {
      const session = sessionsData.sessions[0];
      console.log(`   最新会话: ${session.botName} (${session.sessionId})`);
      
      // 2. 获取会话日志
      console.log('\n2. 获取会话日志...');
      const logsRes = await fetch(`${API_BASE}/api/logs/sessions/${session.sessionId}`);
      const logsData = await logsRes.json();
      console.log(`   找到 ${logsData.total} 条日志`);
      
      if (logsData.logs.length > 0) {
        console.log(`   第一条: ${logsData.logs[0].message}`);
        console.log(`   最后一条: ${logsData.logs[logsData.logs.length - 1].message}`);
      }
      
      // 3. 获取机器人的所有会话
      console.log('\n3. 获取机器人的所有会话...');
      const botSessionsRes = await fetch(`${API_BASE}/api/logs/sessions/bot/${session.botId}`);
      const botSessionsData = await botSessionsRes.json();
      console.log(`   机器人 ${session.botName} 有 ${botSessionsData.sessions.length} 个会话`);
      
      // 4. 检查活跃会话
      console.log('\n4. 检查活跃会话...');
      const activeRes = await fetch(`${API_BASE}/api/logs/active/${session.botId}`);
      const activeData = await activeRes.json();
      console.log(`   活跃状态: ${activeData.active ? '是' : '否'}`);
      if (activeData.active) {
        console.log(`   活跃会话: ${activeData.sessionId}`);
      }
    }
    
    console.log('\n✅ 所有测试通过！');
  } catch (err) {
    console.error('\n❌ 测试失败:', err.message);
  }
}

testLogsAPI();
