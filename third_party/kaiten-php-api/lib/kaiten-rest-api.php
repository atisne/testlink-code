<?php
/**
 * kaiten PHP API
 *
 * Bare bones implementation, just to cover TestLink needs
 *
 * @author   Igor Volodin <vinoron@yandex.ru>
 * @link     https://faq.kaiten.io/docs/api
 *
 */

/**
 *
 */
class kaiten
{
  /**
   * Url to site, http:[yoursite].xxxx.com
   * @var string 
   */
  public $url = '';
  
  /**
   * @var string 
   */
  public $apiKey = '';
  
  /**
   * Curl interface with specific settings
   * @var string 
   */
  public $curl = '';

  public $proxy = null;
  
  public $api = '/api/testlink';
  public $summaryLengthLimit = 1024;

  /**
   * Constructor
   * 
   *
   * @return void
   */
  public function __construct($url,$login,$password,$boardId,$options,$cfg=null) 
  {
    // if the values are not empty, we'll assign them to our matching properties
    $args = ['url','login','password','boardId', 'options'];
    foreach ($args as $arg) 
    {
      if (!empty($$arg)) 
      {
        $this->$arg = $$arg;
      }
    }

    if(!is_null($cfg))
    {
      if(!is_null($cfg->proxy))
      {
        $this->proxy = new stdClass();
        $this->proxy->port = null;
        $this->proxy->host = null;
        $this->proxy->login = null;
        $this->proxy->password = null;

        foreach($cfg->proxy as $prop => $value)
        {
          if(isset($cfg->proxy->$prop))
          {
            $this->proxy->$prop = $value; 
          }  
        }  
      }  
    }  

    $this->initCurl();
  }

  /**
   * 
   *
   */
  public function initCurl($cfg=null) 
  {
    $agent = "TestLink ".TL_VERSION_NUMBER;
    try
    {
      $this->curl = curl_init();
    }
    catch (Exception $e)
    {
      var_dump($e);
    }
    
    // set the agent, forwarding, and turn off ssl checking
    // Timeout in Seconds
    $curlCfg = [CURLOPT_USERAGENT => $agent,
                     CURLOPT_VERBOSE => 0,
                     CURLOPT_FOLLOWLOCATION => TRUE,
                     CURLOPT_RETURNTRANSFER => TRUE,
                     CURLOPT_AUTOREFERER => TRUE,
                     CURLOPT_TIMEOUT => 60,
                     CURLOPT_SSL_VERIFYPEER => FALSE];

    if(!is_null($this->proxy))
    {
      $doProxyAuth = false;
      $curlCfg[CURLOPT_PROXYTYPE] = 'HTTP';

      foreach($this->proxy as $prop => $value)
      {
        switch($prop)
        {
          case 'host':
            $curlCfg[CURLOPT_PROXY] = $value;
          break;

          case 'port':
            $curlCfg[CURLOPT_PROXYPORT] = $value;
          break;

          case 'login':
          case 'password':
            $doProxyAuth = true;
          break;
        }
      }

      if($doProxyAuth && !is_null($this->proxy->login) && 
         !is_null($this->proxy->password) )
      {
        $curlCfg[CURLOPT_PROXYUSERPWD] = 
          $this->proxy->login . ':' . $this->proxy->password;
      }  
    } 

    curl_setopt_array($this->curl,$curlCfg);
  }

  function getIssueURL($issueID)
  {
    return "{$this->url}/c/{$issueID}";
  }

  /**
   * 
   *
   */
  function getIssue($issueID)
  {
    try
    {
      $item = $this->_get("/cards/{$issueID}");    
      $ret = is_object($item) ? $item : null;
      return $ret;
    }
    catch(Exception $e)
    {
      return null;
    }
  } 

  /**
   * 
   *
   */
  public function addIssue($title, $description)
  {
    $safeTitle = (strlen($title) > $this->summaryLengthLimit) ? '...' . substr($title, -1*($this->summaryLengthLimit + 3)) : $title;
    $url = '/cards';
    $body = [
      'title' => $safeTitle,
      'description' => $description,
      'board_id' => (int)$this->boardId,
    ];
    $intOptions = [
      'columnid' => 'column_id',
      'laneid' => 'lane_id',
      'ownerid' => 'owner_id',
      'typeid' => 'type_id',
      'sortorder' => 'sort_order',
      'position' => 'position'
    ];
    $boolOptions = ['asap' => 'asap'];
    $stringOptions = [
      'sizetext' => 'size_text', 
      'businessvalue' => 'business_value'
    ];
    foreach ($intOptions as $opt => $name) 
    {
      if (!empty($this->options[$opt])) 
      {
        $body[$name] = (int)$this->options[$opt];
      }
    }
    foreach ($boolOptions as $opt => $name) 
    {
      if (!empty($this->options[$opt])) 
      {
        $body[$name] = (bool)$this->options[$opt];
      }
    }
    foreach ($stringOptions as $opt => $name) 
    {
      if (!empty($this->options[$opt])) 
      {
        $body[$name] = (string)$this->options[$opt];
      }
    }
    $op = $this->_request_json('POST',$url, $body);

    return $op;
  }

  /**
   * 
   *
   */
  public function addNote($issueID, $noteText)
  {
    $url = "/cards/{$issueID}/comments";
    $body = [
      'text' => $noteText
    ];
    $op = $this->_request_json('POST',$url,$body);
    return $op;
  }
  
  /**
   * 
   *
   */
  function addExternalLinks($cardID, $links)
  {
    $url = "/cards/{$cardID}/external-links";
    $op = null;
    foreach ($links as $link)
    {
      $op = $this->_request_json('POST',$url,$link);
      if (is_null($op))
      {
        break;
      }
    }
    return $op;
  }

  /**
   * 
   *
   */
  function addTags($cardID, $tags)
  {
    $url = "/cards/{$cardID}/tags";
    $op = null;
    foreach ($tags as $tag)
    {
      $op = $this->_request_json('POST',$url,$tag);
      if (is_null($op))
      {
        break;
      }
    }
    return $op;
  }

  /**
   *
   */
  public function getUsers() 
  {                        
    $items = $this->_get("/users");
    return $items;
  }                                                   

  /* -------------------------------------------------------------------------------------- */
  /* General Methods used to build up communication process                                 */
  /* -------------------------------------------------------------------------------------- */

  /** 
   *
   * @internal notice
   * copied and adpated from work on YouTrack API interface by Jens Jahnke <jan0sch@gmx.net>
   **/
  protected function _get($url) 
  {
    return $this->_request_json('GET', $url);
  }

  /** 
  *
  * @internal notice
  * copied and adpated from work on YouTrack API interface by Jens Jahnke <jan0sch@gmx.net>
  **/
  protected function _request_json($method, $url, $body = NULL, $ignore_status = 0,
                                  $reporter=null) 
  {
    $r = $this->_request($method, $url, $body, $ignore_status,$reporter);
    $response = $r['response'];
    $content = $r['content'];
    return ($content != '' ? json_decode($content) : null);
  }
  
 /** 
  *
  * @internal notice
  * copied and adpated from work on YouTrack API interface by Jens Jahnke <jan0sch@gmx.net>
  **/
  protected function _request($method, $cmd, $body = NULL, $ignoreStatusCode = 0,$reporter = null) 
  {
    // this can happens because if I save object on _SESSION PHP is not able to
    // save resources.
    if( !is_resource($this->curl) )
    {
      $this->initCurl();
    }  
    $url = $this->url . $this->api . $cmd;

    curl_setopt($this->curl, CURLOPT_URL, $url);

    if(empty($this->login) || empty($this->password))
    {
      throw new exception(__METHOD__ . " Can not work without login and password");
    } 

    curl_setopt($this->curl, CURLOPT_DNS_USE_GLOBAL_CACHE, false );
    curl_setopt($this->curl, CURLOPT_DNS_CACHE_TIMEOUT, 2 );
  
    $header = [];
    $resultString = base64_encode("{$this->login}:{$this->password}");
    $header[] = "Authorization: Basic {$resultString}";
        
    $header[] = "Content-Type: application/json";
    $header[] = "Agent-Name: testlink";
    $header[] = "Agent-Version: ".TL_VERSION_NUMBER;

    curl_setopt($this->curl, CURLOPT_HEADER, 0); 
    curl_setopt($this->curl, CURLOPT_HTTPHEADER, $header); 

    switch ($method) 
    {
      case 'GET':
        curl_setopt($this->curl, CURLOPT_HTTPGET, TRUE);
      break;
    
      case 'POST':
      case 'PATCH':
        curl_setopt($this->curl, CURLOPT_POST, TRUE);
        if (!empty($body)) 
        {
          curl_setopt($this->curl, CURLOPT_POSTFIELDS, json_encode($body));
        }
      break;
    
      default:
        throw new exception("Unknown method $method!");
      break;
    }
    
    $content = curl_exec($this->curl);
    $response = curl_getinfo($this->curl);
    $curlError =  curl_error($this->curl);
    $httpCode = (int)$response['http_code'];
    if ($httpCode != 200 && $httpCode != 201 && $httpCode != $ignoreStatusCode) 
    {
      throw new exception(__METHOD__ . "url:$this->url - response:" .
                          json_encode($response) . ' - content: ' . json_encode($content) );
    }
    
    $rr = ['content' => $content,'response' => $response,'curlError' => $curlError];
    return $rr;
  }
  
  /**
   * 
   */
  public function __destruct() 
  {
  }

}
