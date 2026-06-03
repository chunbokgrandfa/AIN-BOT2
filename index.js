const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// ─── 슬래시 커맨드 등록 ───────────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("인증패널")
    .setDescription("인증 버튼이 있는 패널을 현재 채널에 전송합니다.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

client.once("ready", async () => {
  console.log(`✅ 봇 로그인 완료: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    console.log("✅ 슬래시 커맨드 등록 완료");
  } catch (err) {
    console.error("슬래시 커맨드 등록 오류:", err);
  }
});

// ─── /인증패널 커맨드 처리 ────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  // 슬래시 커맨드
  if (interaction.isChatInputCommand() && interaction.commandName === "인증패널") {
    const embed = new EmbedBuilder()
      .setTitle("🔐 멤버 인증")
      .setDescription(
        "아래 **인증하기** 버튼을 눌러 길드 이름과 로블록스 이름을 입력해 주세요.\n\n" +
          "인증이 완료되면 닉네임이 `디스코드이름 [길드/로블록스명]` 형식으로 변경됩니다."
      )
      .setColor(0x5865f2)
      .setFooter({ text: "인증 후 서버 이용이 가능합니다." })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_button")
        .setLabel("✅ 인증하기")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    return;
  }

  // ─── 인증 버튼 클릭 → 모달 띄우기 ─────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === "verify_button") {
    const modal = new ModalBuilder()
      .setCustomId("verify_modal")
      .setTitle("멤버 인증");

    const guildInput = new TextInputBuilder()
      .setCustomId("guild_name")
      .setLabel("길드 이름")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("소속 길드 이름을 입력하세요")
      .setRequired(true)
      .setMaxLength(50);

    const robloxInput = new TextInputBuilder()
      .setCustomId("roblox_name")
      .setLabel("로블록스 유저명")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("로블록스 닉네임을 입력하세요")
      .setRequired(true)
      .setMaxLength(20);

    modal.addComponents(
      new ActionRowBuilder().addComponents(guildInput),
      new ActionRowBuilder().addComponents(robloxInput)
    );

    await interaction.showModal(modal);
    return;
  }

  // ─── 모달 제출 처리 ─────────────────────────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === "verify_modal") {
    await interaction.deferReply({ ephemeral: true });

    const guildName = interaction.fields.getTextInputValue("guild_name").trim();
    const robloxName = interaction.fields.getTextInputValue("roblox_name").trim();

    const member = interaction.member;
    const originalName = member.displayName;

    // 이미 인증된 경우: 기존 [태그] 제거 후 재적용
    const cleanName = originalName.replace(/\s*\[.*?\]$/g, "").trim();

    // 새 닉네임 조합: 디스코드이름 [길드/로블록스명]
    const newNickname = `${cleanName} [${guildName}/${robloxName}]`;

    // Discord 닉네임 최대 32자 제한
    const finalNickname = newNickname.slice(0, 32);

    const isAin = guildName.toLowerCase() === "ain";

    try {
      await member.setNickname(finalNickname);

      const ainRole = interaction.guild.roles.cache.find((r) => r.name === "💙Member💙");
      const verifiedRole = interaction.guild.roles.cache.find((r) => r.name === "Verified🟢");

      // 기존 인증 역할 모두 제거
      if (ainRole) await member.roles.remove(ainRole).catch(() => {});
      if (verifiedRole) await member.roles.remove(verifiedRole).catch(() => {});

      const missingRoles = [];

      if (isAin) {
        // ain 길드: 두 역할 모두 부여
        if (ainRole) await member.roles.add(ainRole);
        else missingRoles.push("💙Member💙");
        if (verifiedRole) await member.roles.add(verifiedRole);
        else missingRoles.push("Verified🟢");
      } else {
        // 다른 길드: Verified🟢 만 부여
        if (verifiedRole) await member.roles.add(verifiedRole);
        else missingRoles.push("Verified🟢");
      }

      const roleText = isAin
        ? `${ainRole ? `<@&${ainRole.id}>` : "`💙Member💙`"}, ${verifiedRole ? `<@&${verifiedRole.id}>` : "`Verified🟢`"}`
        : `${verifiedRole ? `<@&${verifiedRole.id}>` : "`Verified🟢`"}`;

      const warningText =
        missingRoles.length > 0
          ? `\n\n⚠️ 서버에서 찾을 수 없는 역할: \`${missingRoles.join(", ")}\``
          : "";

      const successEmbed = new EmbedBuilder()
        .setTitle("✅ 인증 완료!")
        .setDescription(
          `인증이 완료되었습니다!\n\n` +
            `> **길드:** \`${guildName}\`\n` +
            `> **로블록스명:** \`${robloxName}\`\n` +
            `> **새 닉네임:** \`${finalNickname}\`\n` +
            `> **부여된 역할:** ${roleText}` +
            warningText
        )
        .setColor(missingRoles.length > 0 ? 0xfee75c : 0x57f287)
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (err) {
      console.error("인증 처리 오류:", err);

      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ 오류 발생")
        .setDescription(
          "인증 처리 중 오류가 발생했습니다.\n봇의 역할이 해당 멤버 및 부여할 역할보다 높은지 확인해 주세요."
        )
        .setColor(0xed4245)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
});

client.login(process.env.BOT_TOKEN);
